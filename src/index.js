import setConfig from './config';
import Report from './report';
import globals from './globals';
import { getDnsPromise } from './dns';
import { getHook } from './hooks';

const noop = () => {};

function setupTimeoutCapture(wrapperInstance) {
  const { context, sendReport, config } = wrapperInstance;
  const { getRemainingTimeInMillis = () => 0 } = context;

  // if getRemainingTimeInMillis returns a very small number, it's probably a local invoke (sls framework perhaps)
  if (config.timeoutWindow < 1 || getRemainingTimeInMillis() < 10) {
    return undefined;
  }

  const maxEndTime = 599900; /* Maximum execution: 100ms short of 10 minutes */
  const configEndTime = Math.max(
    0,
    getRemainingTimeInMillis() - config.timeoutWindow
  );

  const endTime = Math.min(configEndTime, maxEndTime);

  return setTimeout(() => {
    sendReport.call(wrapperInstance, new Error('Timeout Exceeded.'), () => {});
  }, endTime);
}

class IOpipeWrapperClass {
  constructor(
    originalIdentity,
    libFn,
    plugins = [],
    dnsPromise,
    config,
    userFunc,
    originalEvent,
    originalContext,
    originalCallback
  ) {
    this.startTime = process.hrtime();

    // setup any included plugins
    this.plugins = plugins.map((pluginFn = noop) => {
      if (typeof pluginFn === 'function') {
        return pluginFn(this);
      }
      return {};
    });

    this.runHook('pre:setup');

    // support deprecated iopipe.log
    libFn.log = (...logArgs) => {
      console.warn(
        'iopipe.log is deprecated and will be removed in a future version, please use context.iopipe.log'
      );
      this.log.apply(this, logArgs);
    };

    this.config = config;
    this.metrics = [];

    // assign a new dnsPromise if it's not a coldstart because dns could have changed
    if (!globals.COLDSTART) {
      this.dnsPromise = getDnsPromise(this.config.host);
    } else {
      this.dnsPromise = dnsPromise;
    }

    this.originalIdentity = originalIdentity;
    this.event = originalEvent;
    this.originalContext = originalContext;
    this.originalCallback = originalCallback;
    this.userFunc = userFunc;

    this.setupContext();

    // assign modified methods and objects here
    this.context = Object.assign(this.originalContext, {
      // need to use .bind, otherwise, the this ref inside of each fn is NOT IOpipeWrapperClass
      succeed: this.succeed.bind(this),
      fail: this.fail.bind(this),
      done: this.done.bind(this),
      iopipe: {
        log: this.log.bind(this),
        version: globals.VERSION,
        config: this.config
      }
    });

    this.callback = (err, data) => {
      this.sendReport(err, () => {
        typeof this.originalCallback === 'function' &&
          this.originalCallback(err, data);
      });
    };

    this.timeout = setupTimeoutCapture(this);
    this.report = new Report(this);

    this.runHook('post:setup');

    return this;
  }
  setupContext(reset) {
    // preserve original functions via a property name change
    ['succeed', 'fail', 'done'].forEach(method => {
      Object.defineProperty(
        this.originalContext,
        reset ? method : `original_${method}`,
        Object.getOwnPropertyDescriptor(
          this.originalContext,
          reset ? `original_${method}` : method
        )
      );
      delete this.originalContext[reset ? `original_${method}` : method];
    });
  }
  invoke() {
    this.runHook('pre:invoke');
    try {
      return this.userFunc.call(
        this.originalIdentity,
        this.event,
        this.context,
        this.callback
      );
    } catch (err) {
      this.sendReport(err);
      return err;
    }
  }
  sendReport(err, cb = () => {}) {
    this.runHook('post:invoke');
    this.runHook('pre:report');
    this.setupContext(true);
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.report.send(err, (...args) => {
      this.runHook('post:report');
      cb(...args);
    });
  }
  runHook(hook) {
    const hookString = getHook(hook);
    const { plugins = [] } = this;
    plugins.forEach(plugin => {
      try {
        const fn = plugin.hooks && plugin.hooks[hookString];
        if (typeof fn === 'function') {
          fn(this);
        }
      } catch (err) {
        if (this.config === undefined || this.config.debug) {
          console.error(err);
        }
      }
    });
  }
  succeed(data) {
    this.sendReport(null, () => {
      this.originalContext.succeed(data);
    });
  }
  fail(err) {
    this.sendReport(err, this.originalContext.fail);
  }
  done(err, data) {
    this.sendReport(err, () => {
      this.originalContext.done(err, data);
    });
  }
  log(name, value) {
    var numberValue = undefined;
    var stringValue = undefined;
    if (typeof value === 'number') {
      numberValue = value;
    } else {
      stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    }
    this.metrics.push({
      name,
      n: numberValue,
      s: stringValue
    });
  }
}

module.exports = options => {
  const config = setConfig(options);
  const { plugins } = config;

  const dnsPromise = getDnsPromise(config.host);
  const libFn = userFunc => {
    if (!config.clientId) {
      console.warn(
        'Your function is wrapped with iopipe, but a valid token was not found. Methods such as iopipe.context.log will fail.'
      );
      // No-op if user doesn't set an IOpipe token.
      return userFunc;
    }

    // Assign .log (deprecated) here to avoid type errors
    if (typeof libFn.log !== 'function') {
      libFn.log = () => {};
    }
    return function OriginalCaller(
      originalEvent,
      originalContext,
      originalCallback
    ) {
      const originalIdentity = this;
      return new IOpipeWrapperClass(
        originalIdentity,
        libFn,
        plugins,
        dnsPromise,
        config,
        userFunc,
        originalEvent,
        originalContext,
        originalCallback
      ).invoke();
    };
  };

  // Alias decorate to the wrapper function
  libFn.decorate = libFn;
  return libFn;
};
