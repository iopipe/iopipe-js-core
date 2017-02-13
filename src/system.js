var fs = require('fs')

function readstat(pid) {
  return new Promise((resolve, reject) => {
    fs.readFile(`/proc/${pid}/stat`, function handleRead(err, statFile) {
      if(err) return reject(err)
      var pre_proc_self_stat_fields = statFile.toString().split(" ")
      return resolve({
        utime: pre_proc_self_stat_fields[13],
        stime: pre_proc_self_stat_fields[14],
        cutime: pre_proc_self_stat_fields[15],
        cstime: pre_proc_self_stat_fields[16],
        rss: pre_proc_self_stat_fields[23]
      })
    })
  })
}

function readstatus(pid) {
  return new Promise((resolve, reject) => {
    fs.readFile(`/proc/${pid}/status`, function handleRead(err, data) {
      if(err) return reject(err)
      var proc_self_status_fields = {};
      // Parse status file and apply to the proc_self_status_fields dict.
      data.toString().split("\n").map(
        (line) => {
          return (line) ? line.split("\t") : [ null, null ]
        }
      ).forEach(
        (field) => {
          var key = field[0]
          var value = field[1]
          if (key && value) {
            var trimmedKey = key.replace(':', '')
            var cleanValue = Number(value.replace(/\D/g, ''))
            proc_self_status_fields[trimmedKey] = cleanValue
          }
        }
      )
      return resolve({
        FDSize: proc_self_status_fields['FDSize'],
        Threads: proc_self_status_fields['Threads'],
        VmRSS: proc_self_status_fields['VmRSS'],
      })
    })
  })
}

function readbootid() {
  return new Promise((resolve, reject) => {
    fs.readFile('/proc/sys/kernel/random/boot_id', function handleRead(err, data) {
      if(err) return reject(err)
      resolve(data.toString())
    })
  })
}

module.exports = {
  readstat,
  readstatus,
  readbootid
}
