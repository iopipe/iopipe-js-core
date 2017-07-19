import setConfig from './config';
import Report from './report';
import globals from './globals';
import { getDnsPromise } from './dns';

function setupTimeoutCapture(wrapperInstance) {
  const { modifiedContext, sendReport, config } = wrapperInstance;
  var endTime = 599900; /* Maximum execution: 100ms short of 5 minutes */
  if (config.timeoutWindow < 1) {
    return undefined;
  }

  if (config.timeoutWindow > 0 && modifiedContext.getRemainingTimeInMillis) {
    endTime = Math.max(
      0,
      modifiedContext.getRemainingTimeInMillis() - config.timeoutWindow
    );
  }

  return setTimeout(() => {
    sendReport.call(wrapperInstance, new Error('Timeout Exceeded.'));
  }, endTime);
}

class IOpipeWrapperClass {
  constructor(
    libFn,
    dnsPromise,
    config,
    userFunc,
    originalEvent,
    originalContext,
    originalCallback
  ) {
    // support deprecated iopipe.log
    this.startTime = process.hrtime();

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

    this.originalEvent = originalEvent;
    this.originalContext = originalContext;
    this.originalCallback = originalCallback;
    this.userFunc = userFunc;

    // preserve original functions via a property name change
    ['succeed', 'fail', 'done'].forEach(method => {
      Object.defineProperty(
        this.originalContext,
        `original_${method}`,
        Object.getOwnPropertyDescriptor(this.originalContext, method)
      );
    });

    // assign modified methods and objects here
    this.modifiedContext = Object.assign(this.originalContext, {
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

    this.modifiedCallback = (err, data) => {
      this.sendReport(err, () => {
        typeof this.originalCallback === 'function' &&
          this.originalCallback(err, data);
      });
    };

    this.timeout = setupTimeoutCapture(this);

    this.report = new Report(this);

    return this;
  }
  invoke() {
    try {
      return this.userFunc.call(
        this,
        this.originalEvent,
        this.modifiedContext,
        this.modifiedCallback
      );
    } catch (err) {
      this.sendReport(err);
      return err;
    }
  }
  sendReport(err, cb = () => {}) {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.report.send(err, cb);
  }
  succeed(data) {
    this.sendReport(null, () => {
      this.originalContext.original_succeed(data);
    });
  }
  fail(err) {
    this.sendReport(err, this.originalContext.original_fail);
  }
  done(err, data) {
    this.sendReport(err, () => {
      this.originalContext.original_done(err, data);
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
  const dnsPromise = getDnsPromise(config.host);
  const libFn = userFunc => {
    if (!config.clientId) {
      // No-op if user doesn't set an IOpipe token.
      return userFunc;
    }

    // Assign .log (deprecated) here to avoid type errors
    if (typeof libFn.log !== 'function') {
      libFn.log = () => {};
    }

    return (originalEvent, originalContext, originalCallback) => {
      return new IOpipeWrapperClass(
        libFn,
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
