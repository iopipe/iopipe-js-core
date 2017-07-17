import os from 'os';
import https from 'https';

import globals from './globals';

const system =
  process.platform === 'linux'
    ? require('./system.js')
    : require('./mockSystem.js');
const { log } = console;

function sendRequest(requestBody, config, ipAddress) {
  return new Promise((resolve, reject) => {
    const req = https
      .request(
        {
          hostname: ipAddress,
          servername: config.host,
          path: config.path,
          port: 443,
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          agent: globals.httpsAgent,
          timeout: config.networkTimeout
        },
        res => {
          var apiResponse = '';

          res.on('data', chunk => {
            apiResponse += chunk;
          });

          res.on('end', () => {
            resolve({ status: res.statusCode, apiResponse });
          });
        }
      )
      .on('error', err => {
        reject(err);
      });

    req.write(JSON.stringify(requestBody));
    req.end();
  });
}

class Report {
  constructor(wrapperInstance = {}) {
    this.initalPromises = {
      statPromise: system.readstat('self'),
      bootIdPromise: system.readbootid()
    };

    // flag on report sending status, reports are sent once
    this.sent = false;

    const {
      config = {},
      context = {},
      dnsPromise = Promise.resolve(),
      metrics = [],
      startTime = process.hrtime()
    } = wrapperInstance;

    this.config = config;
    this.context = context;
    this.startTime = startTime;
    this.dnsPromise = dnsPromise;

    // Populate initial report skeleton on construction
    const {
      functionName,
      functionVersion,
      awsRequestId,
      invokedFunctionArn,
      logGroupName,
      logStreamName,
      memoryLimitInMB
    } = this.context;

    this.report = {
      client_id: this.config.clientId || undefined,
      installMethod: this.config.installMethod,
      duration: undefined,
      processId: globals.PROCESS_ID,
      aws: {
        functionName,
        functionVersion,
        awsRequestId,
        invokedFunctionArn,
        logGroupName,
        logStreamName,
        memoryLimitInMB,
        getRemainingTimeInMillis: undefined,
        traceId: process.env._X_AMZN_TRACE_ID
      },
      environment: {
        agent: {
          runtime: 'nodejs',
          version: globals.VERSION,
          load_time: globals.MODULE_LOAD_TIME
        },
        nodejs: {
          version: process.version,
          memoryUsage: undefined
        },
        host: {
          container_id: undefined
        },
        os: {}
      },
      errors: {},
      coldstart: globals.COLDSTART,
      custom_metrics: metrics
    };

    // Set to false after coldstart
    globals.COLDSTART = false;
  }

  send(err, callback) {
    // Send report only once
    if (this.sent) {
      return;
    }
    this.sent = true;
    const self = this;
    const config = this.config;
    const context = this.context;

    // Add error to report if necessary
    if (err) {
      const reportError = typeof err === 'string' ? new Error(err) : err;
      const {
        name,
        message,
        stack,
        lineNumber,
        columnNumber,
        fileName
      } = reportError;

      this.report.errors = {
        name,
        message,
        stack,
        lineNumber,
        columnNumber,
        fileName
      };
    }

    // Resolve system promises/report data
    Promise.all([
      this.initalPromises.statPromise,
      system.readstat('self'),
      system.readstatus('self'),
      this.initalPromises.bootIdPromise
    ]).then(results => {
      const preProcSelfStat = results[0];
      const procSelfStat = results[1];
      const procSelfStatus = results[2];
      const bootId = results[3];

      const osStats = {
        hostname: os.hostname(),
        uptime: os.uptime(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        usedmem: os.totalmem() - os.freemem(),
        cpus: os.cpus(),
        arch: os.arch(),
        linux: {
          pid: {
            self: {
              stat_start: preProcSelfStat,
              stat: procSelfStat,
              status: procSelfStatus
            }
          }
        }
      };

      this.report.environment.os = osStats;
      this.report.environment.host.boot_id = bootId;
      this.report.environment.nodejs.memoryUsage = process.memoryUsage();

      const timeSecNano = process.hrtime(this.startTime);

      this.report.duration = Math.ceil(
        timeSecNano[0] * 1000000000.0 + timeSecNano[1]
      );

      if (context.getRemainingTimeInMillis) {
        this.report.aws.getRemainingTimeInMillis = context.getRemainingTimeInMillis();
      }

      if (config.debug) {
        log('IOPIPE-DEBUG: ', JSON.stringify(this.report));
      }

      this.dnsPromise
        .then(ipAddress => {
          sendRequest(self.report, config, ipAddress)
            .then(function afterRequest(res) {
              if (config.debug) {
                log(`API STATUS FROM ${config.host}: ${res.status}`);
                log(`API RESPONSE FROM ${config.host}: ${res.apiResponse}`);
              }
              self.sent = true;
              callback(err);
            })
            .catch(function handleErr(collectorErr) {
              // Log errors, don't block on failed requests
              if (config.debug) {
                log('Write to IOpipe failed');
                log(collectorErr);
              }
              callback(err);
            });
        })
        .catch(dnsErr => {
          // Log errors, don't block on failed requests
          if (config.debug) {
            log('Write to IOpipe failed. DNS resolution error.');
            log(dnsErr);
          }
          callback(err);
        });
    });
  }
}

module.exports = Report;
