const disk = require('diskusage');

module.exports = function statvfs(path) {
  return new Promise((resolve, reject) => {
    disk.check(path, function(err, info) {
      if (err) {
        reject(err)
        return
      }
      resolve({
        totalBytes: info.total,
        freeBytes: info.free,
        percentageUsed: Math.ceil((1 - (info.free / info.total)) * 100)
      })
    });
  }
}
