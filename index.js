"use strict"

var crypto = require("crypto")
var request = require("request")
var EventEmitter = require("events")
var util = require("util")
var url = require("url")
var path = require("path")
var deepcopy = require('deepcopy')

const DEFAULT_COLLECTOR_URL = "https://metrics-api.iopipe.com"

function _make_generateLog(emitter, func, start_time, config) {
  return function generateLog(err, callback) {
    var hash = crypto.createHash('sha256');
    hash.update(func.toString());
    var function_id = hash.digest('hex')

    var runtime_env = {
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

    var qfuncs = ["uptime", "getuid", "getgid", "geteuid", "getegid", "memoryUsage"]
    for (var i = 0; i < qfuncs.length; i++) {
      // Lacking a process.prototype, evil eval.
      runtime_env.nodejs[qfuncs[i]] = eval("process."+qfuncs[i]+"()")
    }

    var time_sec_nanosec = process.hrtime(start_time)
    var time_secs = time_sec_nanosec[0]
    var time_nanosecs = time_sec_nanosec[1]

    var response_body = {
          function_id: function_id,
          environment: runtime_env,
          errors: retainErr,
          events: emitter.queue,
          time_sec_nanosec: time_sec_nanosec,
          time_sec: time_sec_nanosec[0],
          time_nanosec: time_sec_nanosec[1],
          client_id: config.clientId
        }

    if (config.debug) {
      console.log("IOPIPE-DEBUG: ", response.body)
      callback()
      return
    }
    if (!config.clientId) {
      callback()
      return
    }

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
        /*if (reqErr) {
          console.log("WOLF:IOpipeLoggingError: ", reqErr)
        }*/
        callback()
      }
    )
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

      var start_time = process.hrtime()
      var generateLog = _make_generateLog(emitter, func, start_time, config)
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

        return context
      }
      var new_callback = (callback) => {
        if (typeof(callback) !== 'function') {
          return undefined
        }
        return (err) => {
          //console.log("WOLF:CalledLambdaCallback.")
          var nargs = [].slice.call(arguments)
          generateLog(err, () => {
            callback.apply(callback, nargs)
          })
        }
      }

      /* Mangle arguments, wrapping callbacks. */
      var args = [].slice.call(arguments)
      args[1] = new_context(args[1])
      args[2] = new_callback(args[2])

      var safetyHandler = (err) => {
        //console.log("WOLF:CalledSafetyHandler");
        generateLog(err, () => {})
      }
      process.on('beforeExit', safetyHandler)
      process.on('uncaughtException', function(err) {
        //console.log("WOLF:UncaughtException")
        safetyHandler(err)
        process.nextTick(function() {
          process.removeListener('beforeExit', safetyHandler)
        })
      })

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
