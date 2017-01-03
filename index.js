'use strict'

var pkg = require('./package.json')
var Promise = require('bluebird')
var fs = Promise.promisifyAll(require('fs'))
var request = require('request')
var url = require('url')
var path = require('path')
var os = require('os')
var system = (process.platform === 'linux') ? require('./src/system.js') : require('./src/mockSystem.js')

var Context = require('./src/context.js')
var Callback = require('./src/callback.js')

const VERSION = pkg.version
const DEFAULT_COLLECTOR_URL = 'https://metrics-api.iopipe.com'

function _make_generateLog(emitter, func, start_time, config, context) {
  var pre_stat_promise = system.readstat('self')
  
  return function generateLog(err, callback) {
    Promise.join(
        pre_stat_promise,
        system.readstat('self'),
        system.readstatus('self'),
        system.readbootid()
      ).spread((
        pre_proc_self_stat,
        proc_self_stat,
        proc_self_status,
        boot_id
      ) => {
        var runtime_env = {
          agent: {
            runtime: 'nodejs',
            version: VERSION
          },
          host: {
            vm_id: boot_id
          },
          os: {
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
                  stat_start: pre_proc_self_stat,
                  stat: proc_self_stat,
                  status: proc_self_status
                }
              }
            }
          },
          nodejs: {
            title: process.title,
            version: process.version,
            modulesloadList: process.modulesloadList,
            versions: process.versions,
            arch: process.arch,
            platform: process.platform,
            argv: process.argv,
            execArgv: process.execArgv,
            pid: process.pid,
            features: process.features,
            execPath: process.execPath,
            debugPort: process.debugPort,
            _maxListeners: process._maxListeners,
            config: process.config,
            maxTickDepth: process.maxTickDepth,
            // /* Circular ref */ mainModule: process.mainModule,
            release: process.release,
            uptime: process.uptime(),
            getuid: process.getuid(),
            getgid: process.getgid(),
            geteuid: process.geteuid(),
            getegid: process.getegid(),
            memoryUsage: process.memoryUsage(),
          }
        }

        var retainErr = {}
        if (err) {
          retainErr = ((err) => {
            return {
              name: err.name,
              message: err.message,
              stack: err.stack,
              lineNumber: err.lineNumber,
              columnNumber: err.columnNumber,
              fileName: err.fileName
            }
          })((typeof(err) === 'string') ? new Error(err) : err)
        }

        var time_sec_nanosec = process.hrtime(start_time)

        /*
         depreciated fields:
         - time_sec_nanosec (use duration; 11/23/2016)
         - time_sec (use duration; 11/23/2016)
        */
        var response_body = {
          environment: runtime_env,
          aws: {
            functionName: context.functionName,
            functionVersion: context.functionVersion,
            invokedFunctionArn: context.invokedFunctionArn,
            memoryLimitInMB: context.memoryLimitInMB,
            awsRequestId: context.awsRequestId,
            logGroupName: context.logGroupName,
            logStreamName: context.logStreamName
          },
          errors: retainErr,
          custom_metrics: metrics,
          time_sec_nanosec: time_sec_nanosec,
          time_sec: time_sec_nanosec[0],
          time_nanosec: time_sec_nanosec[1],
          duration: Math.ceil(time_sec_nanosec[0] * 1000000000.0 + time_sec_nanosec[1]),
          client_id: config.clientId
        }

        if (context.getRemainingTimeInMillis) {
          response_body['getRemainingTimeInMillis'] = context.getRemainingTimeInMillis()
        }

        if (config.debug) {
          console.log('IOPIPE-DEBUG: ', response_body)
        }

        if (!config.clientId) {
          callback()
          return
        }
        request(
          {
            url: config.url,
            method: 'POST',
            json: true,
            body: response_body
          },
          function(err) {
            // Throw uncaught errors from the wrapped function.
            if (err) {
              context.fail(err)
            }
            /*if (reqErr) {
              console.log("WOLF:IOpipeLoggingError: ", reqErr)
            }*/
            callback()
          }
        )
      }
    )
  }
}

function setConfig(configObject) {
  var baseurl = (configObject && configObject.url) ? configObject.url : DEFAULT_COLLECTOR_URL
  var eventURL = url.parse(baseurl)
  eventURL.pathname = path.join(eventURL.pathname, 'v0/event')
  eventURL.path = eventURL.search ? eventURL.pathname + eventURL.search : eventURL.pathname

  return {
    url: eventURL,
    clientId: configObject && configObject.clientId || process.env.IOPIPE_CLIENTID || '',
    debug: configObject && configObject.debug || process.env.IOPIPE_DEBUG || false
  }
}

function Agent(configObject) {
  this.config = setConfig(configObject)
  this.metricsQueue = []
}

Agent.prototype.log = function(name, value) {
  var numberValue, stringValue
  if (typeof value === 'number') {
    numberValue = value
  } else {
    if(typeof value === 'object') {
      JSON.stringify(value)
    } else {
      stringValue = String(value)
    }
  }
  this.metricsQueue.push({
    name: name,
    n: numberValue,
    s: stringValue
  })
}

Agent.prototype.decorate = function(func) {
  const config = this.config
  let metricsQueue = this.metricsQueue
  return function() {
    var args = [].slice.call(arguments)

    var start_time = process.hrtime()
    var generateLog = _make_generateLog(metricsQueue, func, start_time, config, args[1])

    /* Mangle arguments, wrapping callbacks. */
    args[1] = Context(generateLog, args[1])
    args[2] = Callback(generateLog, args[2])

    try {
      return func.apply(emitter, args)
    }
    catch (err) {
      generateLog(err, () => {})
      return undefined
    }
  }
}

module.exports.Agent = Agent
