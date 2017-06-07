'use strict'

const globals = require('./globals')
const system = (process.platform === 'linux') ? require('./system.js') : require('./mockSystem.js')
const os = require('os')
const https = require('https')
const log = console.log

function sendRequest(requestBody, config, ipAddress) {
  return new Promise((resolve, reject) => {
    var req = https.request({
      hostname: ipAddress,
      servername: config.host,
      path: config.path,
      port: 443,
      method: 'POST',
      headers: {'content-type' : 'application/json'},
      agent: globals.httpsAgent,
      timeout: config.networkTimeout
    }, (res) => {
      var apiResponse = ''

      res.on('data', function (chunk) {
        apiResponse += chunk
      })

      res.on('end', function () {
        resolve({ status: res.statusCode, apiResponse })
      })
    }).on('error', (err) => {
      reject(err)
    })

    req.write(JSON.stringify(requestBody))
    req.end()
  })
}

class Report {
  constructor(config, context, startTime, metrics, dnsPromise) {
    this.initalPromises = {
      statPromise: system.readstat('self'),
      bootIdPromise: system.readbootid()
    }

    // flag on report sending status, reports are sent once
    this.sent = false

    this.config = config || {}
    this.context = context || {}
    this.startTime = startTime || process.hrtime()
    this.dnsPromise = dnsPromise || Promise.resolve()

    // Populate initial report skeleton on construction
    this.report = {
      client_id: this.config.clientId || undefined,
      installMethod: this.config.installMethod,
      duration: undefined,
      processId: globals.PROCESS_ID,
      aws: {
        functionName: this.context.functionName,
        functionVersion: this.context.functionVersion,
        awsRequestId: this.context.awsRequestId,
        invokedFunctionArn: this.context.invokedFunctionArn,
        logGroupName: this.context.logGroupName,
        logStreamName: this.context.logStreamName,
        memoryLimitInMB: this.context.memoryLimitInMB,
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
        os: {},
      },
      errors: {},
      coldstart: globals.COLDSTART,
      custom_metrics: metrics || [],
    }
  }

  send(err, callback) {

    // Send report only once
    if (this.sent) {
      return
    }
    const self = this
    const config = this.config
    const context = this.context

    // Add error to report if necessary
    if (err) {
      this.report.errors = ((err) => {
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

    // Resolve system promises/report data
    Promise.all([
      this.initalPromises.statPromise,
      system.readstat('self'),
      system.readstatus('self'),
      this.initalPromises.bootIdPromise
    ]).then((results) => {
      const pre_proc_self_stat = results[0],
        proc_self_stat = results[1],
        proc_self_status = results[2],
        boot_id = results[3]

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
                stat_start: pre_proc_self_stat,
                stat: proc_self_stat,
                status: proc_self_status
              }
            }
          }
      }

      this.report.environment.os = osStats
      this.report.environment.host.boot_id = boot_id
      this.report.environment.nodejs.memoryUsage = process.memoryUsage()

      const time_sec_nanosec = process.hrtime(this.startTime)

      this.report.duration = Math.ceil(time_sec_nanosec[0] * 1000000000.0 + time_sec_nanosec[1])

      if (context.getRemainingTimeInMillis) {
        this.report.aws.getRemainingTimeInMillis = context.getRemainingTimeInMillis()
      }

      if (config.debug) {
        log('IOPIPE-DEBUG: ', JSON.stringify(this.report))
      }

      this.dnsPromise.then(function(ipAddress) {
        sendRequest(self.report, config, ipAddress).then(function afterRequest(res) {
          if (config.debug) {
            log(`API STATUS: ${res.status}`)
            log(`API RESPONSE: ${res.apiResponse}`)
          }
          self.sent = true
          callback()
        }).catch(function handleErr(err) {
          // Log errors, don't block on failed requests
          if (config.debug) {
            log('Write to IOpipe failed')
            log(err)
          }
          callback()
        })
      }).catch((err) => {
        // Log errors, don't block on failed requests
        if (config.debug) {
          log('Write to IOpipe failed. DNS resolution error.')
          log(err)
        }
        callback()
      })
    })
  }
}

module.exports = Report
