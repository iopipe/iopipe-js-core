import setConfig from './config';
import Report from './report';
import { COLDSTART, VERSION } from './globals';
import { getDnsPromise } from './dns';
import { getHook } from './hooks';
import { convertToString } from './util';
import setupPlugins from './util/setupPlugins';
import getFileUploadMeta from './fileUploadMeta';
import {
  set as setInvocationContext,
  get as getInvocationContext
} from './invocationContext';

/*eslint-disable no-console*/

function setupTimeoutCapture(wrapperInstance) {
  const { context, sendReport, config } = wrapperInstance;
  const { getRemainingTimeInMillis = () => 0 } = context;

  // if getRemainingTimeInMillis returns a very small number, it's probably a local invoke (sls framework perhaps)
  if (config.timeoutWindow < 1 || getRemainingTimeInMillis() < 10) {
    return undefined;
  }

  const maxEndTime = 899900; /* Maximum execution: 100ms short of 15 minutes */
  const configEndTime = Math.max(
    0,
    getRemainingTimeInMillis.call(context) - config.timeoutWindow
  );

  const endTime = Math.min(configEndTime, maxEndTime);

  return setTimeout(() => {
    context.iopipe.label('@iopipe/timeout');
    sendReport.call(wrapperInstance, new Error('Timeout Exceeded.'), () => {});
  }, endTime);
}

process.on('unhandledRejection', error => {
  const ctx = getInvocationContext();
  if (ctx && ctx.iopipe && ctx.iopipe.label) {
    // default node behavior is to log these types of errors
    console.error(error);
    ctx.iopipe.label('@iopipe/unhandled-promise-rejection');
    ctx.iopipe.label('@iopipe/error');
  }
});

//TODO: refactor to abide by max-params rule*/
/*eslint-disable max-params*/

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
    this.startTimestamp = Date.now();
    this.config = config;
    this.metrics = [];
    this.labels = new Set();
    this.originalIdentity = originalIdentity;
    this.event = originalEvent;
    this.originalContext = originalContext;
    this.originalCallback = originalCallback;
    this.userFunc = userFunc;
    this.hasSentReport = false;

    this.plugins = setupPlugins(this, plugins);

    this.runHook('pre:setup');

    // support deprecated iopipe.log
    libFn.log = (...logArgs) => {
      console.warn(
        'iopipe.log is deprecated and will be removed in a future version, please use context.iopipe.metric'
      );
      this.log(...logArgs);
    };

    if (COLDSTART) {
      this.dnsPromise = dnsPromise;
    } else {
      // assign a new dnsPromise if it's not a coldstart because dns could have changed
      this.dnsPromise = getDnsPromise(this.config.host);
    }

    this.setupContext();

    // assign modified methods and objects here
    this.context = Object.assign(this.originalContext, {
      // need to use .bind, otherwise, the this ref inside of each fn is NOT IOpipeWrapperClass
      succeed: this.succeed.bind(this),
      fail: this.fail.bind(this),
      done: this.done.bind(this),
      iopipe: {
        label: this.label.bind(this),
        log: this.log.bind(this),
        metric: this.metric.bind(this),
        version: VERSION,
        config: this.config
      }
    });

    setInvocationContext(this.context);

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
      const descriptor = Object.getOwnPropertyDescriptor(
        this.originalContext,
        reset ? `original_${method}` : method
      );
      if (descriptor) {
        Object.defineProperty(
          this.originalContext,
          reset ? method : `original_${method}`,
          descriptor
        );
      }
      delete this.originalContext[reset ? `original_${method}` : method];
    });
  }
  debugLog(message, level = 'warn') {
    if (this.config.debug) {
      console[level](message);
    }
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
      this.sendReport(err, () => this.originalCallback(err));
      return err;
    }
  }
  async sendReport(err, cb = () => {}) {
    if (!this.hasSentReport) {
      this.hasSentReport = true;
      await this.runHook('post:invoke');
      await this.report.prepare(err);
      await this.runHook('pre:report');
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      this.report.send(async (...args) => {
        await this.runHook('post:report');
        setInvocationContext(undefined);
        // reset the context back to its original state, otherwise aws gets unhappy
        this.setupContext(true);
        cb(...args);
      });
    }
  }
  async runHook(hook) {
    const hookString = getHook(hook);
    const { plugins = [] } = this;
    try {
      await Promise.all(
        plugins.map(plugin => {
          try {
            const fn = plugin.hooks && plugin.hooks[hookString];
            if (typeof fn === 'function') {
              return fn(this);
            }
          } catch (err) {
            // if this.config is undefined, the hook is probably pre:setup
            // lets error out if that is the case
            if (this.config === undefined || this.config.debug) {
              console.error(err);
            }
          }
          return Promise.resolve();
        })
      );
    } catch (error) {
      if (this.config === undefined || this.config.debug) {
        console.error(error);
      }
    }
  }
  succeed(data) {
    this.sendReport(null, () => {
      this.originalContext.succeed(data);
    });
  }
  fail(err) {
    this.sendReport(err, () => {
      this.originalContext.fail(err);
    });
  }
  done(err, data) {
    this.sendReport(err, () => {
      this.originalContext.done(err, data);
    });
  }
  metric(keyInput, valueInput) {
    let numberValue, stringValue;
    const key = convertToString(keyInput);
    if (key.length > 128) {
      this.debugLog(
        `Metric with key name ${key} is longer than allowed length of 128, metric will not be saved`
      );
      return;
    }
    if (Number.isFinite(valueInput)) {
      numberValue = valueInput;
    } else {
      stringValue = convertToString(valueInput);
    }
    this.metrics.push({
      name: key,
      n: numberValue,
      s: stringValue
    });
    // Automatically label that this invocation contains metrics
    if (!key.startsWith('@iopipe')) {
      this.label('@iopipe/metrics');
    }
  }
  label(name) {
    if (typeof name !== 'string') {
      this.debugLog(`Label ${name} is not a string and will not be saved`);
      return;
    }
    if (name.length > 128) {
      this.debugLog(
        `Label with name ${name} is longer than allowed length of 128, label will not be saved`
      );
      return;
    }
    this.labels.add(name);
  }
  // DEPRECATED: This method is deprecated in favor of .metric and .label
  log(name, value) {
    this.debugLog(
      'context.iopipe.log is deprecated and will be removed in a future version, please use context.iopipe.metric'
    );
    this.metric(name, value);
  }
}

module.exports = options => {
  const config = setConfig(options);
  const { plugins } = config;

  const dnsPromise = getDnsPromise(config.host);
  const libFn = userFunc => {
    if (!config.enabled) {
      // No-op if agent is disabled
      return userFunc;
    }

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

module.exports.getContext = getInvocationContext;

module.exports.util = {
  getFileUploadMeta
};
