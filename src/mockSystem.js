import uuid from './uuidv4';

function readstat() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        utime: 0,
        stime: 0,
        cutime: 0,
        cstime: 0,
        rss: 0
      });
    }, 2);
  });
}
function readstatus() {
  const mem = process.memoryUsage();
  return Promise.resolve({
    FDSize: 0,
    Threads: 1,
    VmRSS: mem.rss / 1024
  });
}

function readbootid() {
  return Promise.resolve(uuid());
}

module.exports = {
  readstat,
  readstatus,
  readbootid
};
