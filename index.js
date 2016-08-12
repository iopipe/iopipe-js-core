"use strict"

var AWS = require("aws-sdk")

var crypto = require("crypto")
var EventEmitter = require("events")
var util = require("util")
var url = require("url")
var path = require("path")
var os = require("os")
var deepcopy = require('deepcopy')

const VERSION = "0.0.20"
const DEFAULT_COLLECTOR_URL = "https://metrics-api.iopipe.com"

function _make_generateLog(emitter, func, start_time, config, context) {
  return function generateLog(err, callback) {
    var hash = crypto.createHash('sha256');
    hash.update(func.toString());
    var function_id = hash.digest('hex')

    var runtime_env = {
      agent: {
        runtime: "nodejs",
        version: VERSION
      },
      os: {
        hostname: os.hostname(),
        totalmem: os.totalmem(),
        uptime: os.uptime(),
        freemem: os.freemem(),
        cpus: os.cpus(),
        arch: os.arch()
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
      }
    }

    var retainErr = {};
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
                  })((typeof(err) === "string") ? new Error(err) : err)
    }

    runtime_env.nodejs = {
      uptime: process.uptime(),
      getuid: process.getuid(),
      getgid: process.getgid(),
      geteuid: process.geteuid(),
      getegid: process.getegid(),
      memoryUsage: process.memoryUsage()
    }

    var time_sec_nanosec = process.hrtime(start_time)
    var time_secs = time_sec_nanosec[0]
    var time_nanosecs = Math.ceil(time_secs * 1000000000.0 + time_sec_nanosec[1])

    var aws_region = context.invokedFunctionArn.split(":", 4)[3]
    var response_body = {
          function_id: function_id,
          environment: runtime_env,
          aws: {
            functionName: context.functionName,
            functionVersion: context.functionVersion,
            invokedFunctionArn: context.invokedFunctionArn,
            memoryLimitInMB: context.memoryLimitInMB,
            awsRequestId: context.awsRequestId,
            logGroupName: context.logGroupName,
            logStreamName: context.logStreamName,
            region: aws_region
          },
          errors: retainErr,
          events: emitter.queue,
          time_sec_nanosec: time_sec_nanosec,
          time_sec: time_sec_nanosec[0],
          time_nanosec: time_sec_nanosec[1],
          client_id: config.clientId
        }

    if (context.getRemainingTimeInMillis) {
      response_body['getRemainingTimeInMillis'] = context.getRemainingTimeInMillis()
    }

    if (config.debug) {
      console.log("IOPIPE-DEBUG: ", response_body)
      callback()
      return
    }
    if (!config.clientId) {
      callback()
      return
    }

    var lambda = new AWS.Lambda();
    lambda.invoke({
      FunctionName: 'arn:aws:lambda:' + aws_region + ':554407330061:function:iopipe-org-collector_iopipe-event-store',
      InvocationType: "Event",
      Payload: JSON.stringify({ payload: response_body })
    }, (err, data) => {
      if (err || data.StatusCode != 202) {
        console.log("IOpipe cross-lambda error. Fallback to RESTful API.", err)

        request(
          {
            url: config.url,
            method: "POST",
            json: true,
            body: response_body
          },
          function(reqErr, res, body) {
            // Throw uncaught errors from the wrapped function.
            if (err) {
              context.fail(err)
            }
            callback()
          }
        )
      }
      callback()
    })
  }
}

function _agentEmitter() {
  this.queue = []
  EventEmitter.call(this);
}
util.inherits(_agentEmitter, EventEmitter)

module.exports = function(configObject) {
  return function(func) {
    return function() {
      var baseurl = (configObject && configObject.url) ? configObject.url : DEFAULT_COLLECTOR_URL
      var eventURL = url.parse(baseurl)
      eventURL.pathname = path.join(eventURL.pathname, 'v0/event')
      eventURL.path = eventURL.search ? eventURL.pathname + eventURL.search : eventURL.pathname

      var config = {
        url: eventURL,
        clientId: configObject.clientId || ""
      }

      var emitter = new _agentEmitter()
      emitter.on("iopipe_event", (type, data) => {
        emitter.queue.push([type, data])
      })

      var args = [].slice.call(arguments)

      var start_time = process.hrtime()
      var generateLog = _make_generateLog(emitter, func, start_time, config, args[1])
      var new_context = (old_context) => {
        var context = deepcopy(old_context)
        context.succeed = function(data) {
          //console.log("WOLF:CalledContextSucceed.")
          generateLog(null, () => {
            old_context.succeed(data)
          })
        }
        context.fail = function(err) {
          //console.log("WOLF:CalledContextFail.")
          generateLog(err, () => {
            old_context.fail(err)
          })
        }
        context.done = function(err, data) {
          //console.log("WOLF:CalledContextDone.")
          generateLog(err, () => {
            old_context.done(err, data)
          })
        }
        context.iopipe_log = function(level, data) {
          emitter.queue.push([level, data])
        }
        context.getRemainingTimeInMillis = old_context.getRemainingTimeInMillis
        /* Map getters/setters */
        context.__defineGetter__('callbackWaitsForEmptyEventLoop',
                                 () => { return old_context.callbackWaitsForEmptyEventLoop })
        context.__defineSetter__('callbackWaitsForEmptyEventLoop',
                                 (value) => { old_context.callbackWaitsForEmptyEventLoop = value })

        return context
      }
      var new_callback = (callback) => {
        if (typeof(callback) !== 'function') {
          return undefined
        }
        return (err, data) => {
          //console.log("WOLF:CalledLambdaCallback.")
          generateLog(err, () => {
            callback.apply(callback, [err, data])
          })
        }
      }

      /* Mangle arguments, wrapping callbacks. */
      args[1] = new_context(args[1])
      args[2] = new_callback(args[2])

      try {
        return func.apply(emitter, args)
      }
      catch (err) {
        generateLog(err, () => {})
        return undefined
      }
    }
  }
}
