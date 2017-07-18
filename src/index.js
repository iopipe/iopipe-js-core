import dns from 'dns';
import setConfig from './config';
import Report from './report';
import globals from './globals';

function getDnsPromise(host) {
  return new Promise((resolve, reject) => {
    dns.lookup(host, (err, address) => {
      if (err) {
        reject(err);
      }
      resolve(address);
    });
  });
}

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
    sendReport(new Error('Timeout Exceeded.'));
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
    libFn.log = this.log.bind(this);
    this.startTime = process.hrtime();
    this.config = config;
    this.metrics = [];

    // assign a new dnsPromise if it's not a coldstart because dns could have changed
    if (!globals.COLDSTART) {
      this.dnsPromise = getDnsPromise(this.config.host);
    } else {
      this.dnsPromise = dnsPromise;
    }

    this.originalContext = originalContext;
    this.originalCallback = originalCallback;

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

    try {
      userFunc.call(
        this,
        originalEvent,
        this.modifiedContext,
        this.modifiedCallback
      );
    } catch (err) {
      this.sendReport(err);
    }
    return this;
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
      );
    };
  };

  // Alias decorate to the wrapper function
  libFn.decorate = libFn;
  // Used for tests
  if (process.env.DNS_ON_LIB) {
    libFn.dnsPromise = dnsPromise;
  }
  return libFn;
};
