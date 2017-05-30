'use strict'

const pkg = require('./package.json')
const os = require('os')
const https = require('https')
const uuid = require('uuid')

const system = (process.platform === 'linux') ? require('./src/system.js') : require('./src/mockSystem.js')
const setConfig = require('./src/config.js')
const Context = require('./src/context.js')
const Callback = require('./src/callback.js')

const VERSION = pkg.version
const MODULE_LOAD_TIME = Date.now()
const PROCESS_ID = uuid.v4()
const httpsAgent = new https.Agent({
  maxCachedSessions: 1,
  keepAlive: true
});

httpsAgent.originalCreateConnection = httpsAgent.createConnection
httpsAgent.createConnection = function(port, host, options) {
  /* noDelay is documented as defaulting to true, but docs lie.
     this sacrifices throughput for latency and should be faster
     for how we submit data. */
  var socket = httpsAgent.originalCreateConnection(port, host, options);
  socket.setNoDelay(true);
  return socket
}

// Default on module load; changed to false on first handler invocation.
var COLDSTART = true


function _make_generateLog(metrics, func, start_time, config, context) {
  var pre_stat_promise = system.readstat('self')

  return function generateLog(err, callback) {
    Promise.all([
        pre_stat_promise,
        system.readstat('self'),
        system.readstatus('self'),
        system.readbootid()
      ]).then((
        pre_proc_self_stat,
        proc_self_stat,
        proc_self_status,
        boot_id
      ) => {
        var runtime_env = {
          agent: {
            runtime: 'nodejs',
            version: VERSION,
            load_time: MODULE_LOAD_TIME
          },
          host: {
            container_id: boot_id
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
          coldstart: COLDSTART,
          errors: retainErr,
          custom_metrics: metrics,
          time_sec_nanosec: time_sec_nanosec,
          time_sec: time_sec_nanosec[0],
          time_nanosec: time_sec_nanosec[1],
          duration: Math.ceil(time_sec_nanosec[0] * 1000000000.0 + time_sec_nanosec[1]),
          processId: PROCESS_ID,
          client_id: config.clientId,
          installMethod: config.installMethod
        }

        if (COLDSTART === true) {
          COLDSTART = false
        }

        if (context.getRemainingTimeInMillis) {
          response_body.aws.getRemainingTimeInMillis = context.getRemainingTimeInMillis()
        }

        if (config.debug) {
          console.log('IOPIPE-DEBUG: ', JSON.stringify(response_body))
        }

        var req = https.request({
          hostname: config.url,
          path: config.path,
          port: 443,
          method: 'POST',
          headers: {'content-type' : 'application/json'},
          agent: httpsAgent,
          timeout: config.networkTimeout
        }, (res) => {
          var apiResponse = ''

          res.on('data', function (chunk) {
            apiResponse += chunk
          })

          res.on('end', function () {
            if (config.debug) {
              console.log(`API STATUS: ${res.statusCode}`)
              console.log(`API RESPONSE: ${apiResponse}`)
            }
            callback()
          })
        }).on('error', (err) => {
          // Log errors, don't block on failed requests
          if (config.debug) {
            console.log('Write to IOpipe failed')
            console.log(err)
          }
          callback()
        })

        req.write(JSON.stringify(response_body))
        req.end()
      }
    ).catch((err) => {
      if (err && config.debug) {
        console.log('Error collecting IOpipe data:')
        console.log(err)
      }
      callback()
    })
  }
}

module.exports = function(options) {
  var fn = function(func) {
    fn.metricsQueue = []
    const config = setConfig(options)

    if (!config.clientId) {
      // No-op if user doesn't set an IOpipe token.
      return func
    }

    return function() {
      fn.metricsQueue = []
      let args = [].slice.call(arguments)

      var start_time = process.hrtime()
      var generateLog = _make_generateLog(fn.metricsQueue, func, start_time, config, args[1])

      var end_time = 599900  /* Maximum execution: 100ms short of 5 minutes */
      if (config.timeoutWindow > 0 && args[1] && args[1].getRemainingTimeInMillis) {
        end_time = Math.max(0, args[1].getRemainingTimeInMillis() - config.timeoutWindow)
      }

      var timeout = setTimeout(() => {
        generateLog(new Error("Timeout Exceeded."), function noop() {})
      }, end_time)

      var callback = (err, cb) => {
        clearTimeout(timeout)
        generateLog(err, cb)
      }

      /* Mangle arguments, wrapping callbacks. */
      args[1] = Context(callback, args[1])
      args[2] = Callback(callback, args[2])

      try {
        return func.apply(this, args)
      }
      catch (err) {
        clearTimeout(timeout)
        generateLog(err, function noop() {})
        return undefined
      }
    }
  }

  // Alias decorate to the wrapper function
  fn.decorate = fn

  fn.log = function(name, value) {
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
    fn.metricsQueue.push({
      name: name,
      n: numberValue,
      s: stringValue
    })
  }

  return fn
}
