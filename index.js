'use strict';
const dns = require('dns');
const setConfig = require('./src/config.js');
const Context = require('./src/context.js');
const Callback = require('./src/callback.js');
const Report = require('./src/report.js');
const globals = require('./src/globals');

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

function setupTimeoutCapture(config, report, context) {
  var endTime = 599900; /* Maximum execution: 100ms short of 5 minutes */
  if (config.timeoutWindow < 1) {
    return undefined;
  }

  if (config.timeoutWindow > 0 && context && context.getRemainingTimeInMillis) {
    endTime = Math.max(
      0,
      context.getRemainingTimeInMillis() - config.timeoutWindow
    );
  }

  return setTimeout(() => {
    report.send(new Error('Timeout Exceeded.'), function noop() {});
  }, endTime);
}

module.exports = options => {
  const fn = func => {
    var dnsPromise = undefined;
    fn.metricsQueue = [];
    const config = setConfig(options);

    if (!config.clientId) {
      // No-op if user doesn't set an IOpipe token.
      return func;
    }

    /* resolve DNS early on coldstarts */
    dnsPromise = makeDnsPromise(config.host);

    return function IOpipeWrapper() {
      fn.metricsQueue = [];
      const args = [].slice.call(arguments);

      if (!globals.COLDSTART) {
        /* Get an updated DNS record. */
        dnsPromise = makeDnsPromise(config.host);
      }

      const startTime = process.hrtime();
      const report = new Report(
        config,
        args[1],
        startTime,
        fn.metricsQueue,
        dnsPromise
      );

      const timeout = setupTimeoutCapture(config, report, args[1]);

      const callback = (err, cb) => {
        if (timeout) {
          clearTimeout(timeout);
        }
        report.send(err, cb);
      };

      /* Mangle arguments, wrapping callbacks. */
      args[1] = Context(callback, args[1]);
      args[2] = Callback(callback, args[2]);

      try {
        return func.apply(this, args);
      } catch (err) {
        clearTimeout(timeout);
        report.send(err, function noop() {});
        return undefined;
      }
    };
  };

  // Alias decorate to the wrapper function
  fn.decorate = fn;

  fn.log = (name, value) => {
    var numberValue = undefined;
    var stringValue = undefined;
    if (typeof value === 'number') {
      numberValue = value;
    } else {
      if (typeof value === 'object') {
        JSON.stringify(value);
      } else {
        stringValue = String(value);
      }
    }
    fn.metricsQueue.push({
      name: name,
      n: numberValue,
      s: stringValue
    });

    fn.VERSION = globals.VERSION;
  };

  return fn;
};
