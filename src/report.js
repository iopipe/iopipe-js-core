import os from 'os';
import { sendReport } from './sendReport';

import {
  COLDSTART,
  MODULE_LOAD_TIME,
  PROCESS_ID,
  VERSION,
  setColdStart
} from './globals';

const system =
  process.platform === 'linux'
    ? require('./system.js')
    : require('./mockSystem.js');

const { log } = console;

class Report {
  constructor(wrapperInstance = {}) {
    this.initalPromises = {
      statPromise: system.readstat('self'),
      bootIdPromise: system.readbootid()
    };

    // flag on report preparation status, reports are prepared once
    this.prepared = false;

    // flag on report sending status, reports are sent once
    this.sent = false;

    const {
      config = {},
      context = {},
      dnsPromise = Promise.resolve(),
      metrics = [],
      labels = new Set(),
      plugins = [],
      startTime = process.hrtime(),
      startTimestamp = Date.now()
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
      logGroupName,
      logStreamName,
      memoryLimitInMB
    } = this.context;

    let { invokedFunctionArn } = this.context;

    // Patch invokedFunctionArn in cases of SAM local invocations
    // or if invokedFunctionArn is missing
    if (invokedFunctionArn === undefined || process.env.AWS_SAM_LOCAL) {
      invokedFunctionArn = `arn:aws:lambda:local:0:function:${functionName}`;
    }

    const pluginMetas = plugins
      .filter(plugin => typeof plugin !== 'undefined')
      .map(plugin => {
        const meta = plugin.meta || {};

        if (meta) {
          meta.uploads = meta.uploads || [];
        }

        return meta;
      });

    this.report = {
      /*eslint-disable camelcase*/
      client_id: this.config.clientId || undefined,
      installMethod: this.config.installMethod,
      duration: undefined,
      processId: PROCESS_ID,
      timestamp: startTimestamp,
      aws: {
        functionName,
        functionVersion,
        awsRequestId,
        invokedFunctionArn,
        logGroupName,
        logStreamName,
        memoryLimitInMB,
        getRemainingTimeInMillis: undefined,
        /*eslint-disable no-underscore-dangle*/
        traceId: process.env._X_AMZN_TRACE_ID
        /*eslint-enable no-underscore-dangle*/
      },
      environment: {
        agent: {
          runtime: 'nodejs',
          version: VERSION,
          load_time: MODULE_LOAD_TIME
        },
        runtime: {
          name: process.release.name,
          version: process.version
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
      coldstart: COLDSTART,
      custom_metrics: metrics,
      labels,
      plugins: pluginMetas
    };

    // Set to false after coldstart
    setColdStart(false);
  }

  async prepare(err) {
    // Prepare report only once
    if (this.prepared) {
      return;
    }

    this.prepared = true;

    const config = this.config;
    const context = this.context;

    // Add error to report if necessary
    if (err) {
      this.report.labels.add('@iopipe/error');
      const reportError =
        err instanceof Error
          ? err
          : new Error(typeof err === 'string' ? err : JSON.stringify(err));
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
    const results = await Promise.all([
      this.initalPromises.statPromise,
      system.readstat('self'),
      system.readstatus('self'),
      this.initalPromises.bootIdPromise
    ]);

    const [preProcSelfStat, procSelfStat, procSelfStatus, bootId] = results;

    const totalmem = os.totalmem();
    const freemem = os.freemem();

    const osStats = {
      hostname: os.hostname(),
      uptime: os.uptime(),
      totalmem,
      freemem,
      usedmem: totalmem - freemem,
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

    if (context.getRemainingTimeInMillis) {
      this.report.aws.getRemainingTimeInMillis = context.getRemainingTimeInMillis();
    }

    this.report.timestampEnd = Date.now();

    const durationHrTime = process.hrtime(this.startTime);

    this.report.duration = Math.ceil(
      durationHrTime[0] * 1e9 + durationHrTime[1]
    );

    if (this.report.coldstart) {
      this.report.labels.add('@iopipe/coldstart');
      this.report.duration = Math.ceil(process.uptime() * 1e9);
    }

    // Convert labels from set to array
    this.report.labels = Array.from(this.report.labels);

    if (config.debug) {
      log('IOPIPE-DEBUG: ', JSON.stringify(this.report));
    }
    /*eslint-enable camelcase*/
  }

  send(callback) {
    // Send report only once
    if (this.sent) {
      return;
    }

    this.sent = true;

    const self = this;
    const config = this.config;

    this.dnsPromise
      .then(ipAddress => {
        sendReport(self.report, config, ipAddress)
          .then(function afterRequest(res) {
            if (config.debug) {
              log(`API STATUS FROM ${config.host}: ${res.status}`);
              log(`API RESPONSE FROM ${config.host}: ${res.apiResponse}`);
            }

            callback(null, res);
          })
          .catch(function handleErr(err) {
            // Log errors, don't block on failed requests
            if (config.debug) {
              log('Write to IOpipe failed');
              log(err);
            }

            callback(err);
          });
      })
      .catch(err => {
        // Log errors, don't block on failed requests
        if (config.debug) {
          log('Write to IOpipe failed. DNS resolution error.');
          log(err);
        }

        callback(err);
      });
  }
}

export default Report;
