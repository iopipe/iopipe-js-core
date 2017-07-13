import dns from 'dns';
import setConfig from './config';
import Report from './report';
import globals from './globals';

let config = setConfig();
let dnsPromise = undefined;

function makeDnsPromise(host) {
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
  const { modifiedContext, sendReport } = wrapperInstance;
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
  constructor(userFunc, originalEvent, originalContext, originalCallback) {
    if (!globals.COLDSTART) {
      /* Get an updated DNS record. */
      dnsPromise = makeDnsPromise(config.host);
    }

    this.metrics = [];
    this.originalContext = originalContext;
    this.originalCallback = originalCallback;
    this.report = new Report(
      config,
      this.originalContext,
      process.hrtime(),
      this.metrics,
      dnsPromise
    );

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
        metrics: this.metrics,
        version: globals.VERSION
      }
    });

    this.modifiedCallback = (err, data) => {
      this.sendReport(err, () => {
        typeof this.originalCallback === 'function' &&
          this.originalCallback(err, data);
      });
    };

    this.timeout = setupTimeoutCapture(this);

    try {
      return userFunc.call(
        this,
        originalEvent,
        this.modifiedContext,
        this.modifiedCallback
      );
    } catch (err) {
      this.sendReport(err);
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
  log(name, value = 1) {
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
  config = setConfig(options);
  const fn = userFunc => {
    if (!config.clientId) {
      // No-op if user doesn't set an IOpipe token.
      return userFunc;
    }

    /* resolve DNS early on coldstarts */
    dnsPromise = makeDnsPromise(config.host);
    return (originalEvent, originalContext, originalCallback) => {
      return new IOpipeWrapperClass(
        userFunc,
        originalEvent,
        originalContext,
        originalCallback
      );
    };
  };

  // Alias decorate to the wrapper function
  fn.decorate = fn;
  return fn;
};
