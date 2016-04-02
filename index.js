var crypto = require("crypto");
var request = require("request");

const COLLECTOR_URL = "https://metrics.in.iopipe.com"

function generateLog(err) {
    var hash = crypto.createHash('sha256');
    hash.update(require.main.exports.toString());
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
        env: process.env,
        pid: process.pid,
        features: process.features,
        execPath: process.execPath,
        debugPort: process.debugPort,
        _maxListeners: process._maxListeners,
        config: process.config,
        maxTickDepth: process.maxTickDepth,
        // /* Circular ref */ mainModule: process.mainModule,
        release: process.release
      }
    }
  
    var retainErr; 
    if (err) {
      retainErr = { name: err.name,
                    message: err.message,
                    stack: err.stack,
                    lineNumber: err.lineNumber,
                    columnNumber: err.columnNumber,
                    fileName: err.fileName
                  }
    }

    var qfuncs = ["uptime", "getuid", "getgid", "geteuid", "getegid", "memoryUsage"]
    for (var i = 0; i < qfuncs.length; i++) {
      // Lacking a process.prototype, evil eval.
      runtime_env.nodejs[qfuncs[i]] = eval("process."+qfuncs[i]+"()")
    }
    
    //request.post(
    console.log([
      COLLECTOR_URL,
      JSON.stringify({
        function_id: function_id,
        environment: runtime_env,
        errors: retainErr
      }),
      function(data, err) {
      }
    ])
}

module.exports = function() {
  process.on('beforeExit', generateLog)

  process.on('uncaughtException', function(err) {
    generateLog(err)
    process.nextTick(function() {
      process.removeListener('beforeExit', generateLog)
    })
  })
}
