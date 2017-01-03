var uuid = require('uuid')

function readstat(pid) {
  return Promise.resolve({
    utime: 0,
    stime: 0,
    cutime: 0,
    cstime: 0,
    rss: 0
  })
}

function readstatus(pid) {
  var mem = process.memoryUsage()
  return Promise.resolve({
    FDSize: 0,
    Threads: 1,
    VmRSS: mem.rss / 1024,
    VmData: 0,
    VmStk: 0,
    VmExe: 0,
    VmSwap: 0
  })
}

function readbootid () {
  return Promise.resolve(uuid.v4())
}

module.exports = {
  readstat,
  readstatus,
  readbootid
}
