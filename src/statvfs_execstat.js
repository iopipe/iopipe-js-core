var child_process = require('child_process')

module.exports = function statvfs(path) {
  return new Promise((resolve, reject) => {
    child_process.execFile('stat', ['-f', '--format="%b %f %s"', path], (err, stdout, stderr) => {
      if (err) {
        reject(err)
        return
      }
      var statInfo = stdout.split(" ")
      var blockSize = statInfo[2]
      var freeBytes = statInfo[1] * blockSize / 1024.0
      var totalBytes = statInfo[0] * blockSize / 1024.0
      resolve({
        totalBytes: totalBytes,
        freeBytes: freeBytes,
        percentageUsed: Math.ceil((1 - (freeBytes / totalBytes)) * 100)
      })
    })
  }
}
