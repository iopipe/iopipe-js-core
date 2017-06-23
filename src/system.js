const fs = require('fs');

function readstat(pid) {
  return new Promise((resolve, reject) => {
    fs.readFile(`/proc/${pid}/stat`, function handleRead(err, statFile) {
      const preProcSelfStatFields = (statFile || '').toString().split(' ');
      if (err) return reject(err);
      return resolve({
        utime: preProcSelfStatFields[13],
        stime: preProcSelfStatFields[14],
        cutime: preProcSelfStatFields[15],
        cstime: preProcSelfStatFields[16],
        rss: preProcSelfStatFields[23]
      });
    });
  });
}

function readstatus(pid) {
  return new Promise((resolve, reject) => {
    fs.readFile(`/proc/${pid}/status`, function handleRead(err, data) {
      const procSelfStatusFields = {};
      if (err) return reject(err);
      // Parse status file and apply to the procSelfStatusFields dict.
      data
        .toString()
        .split('\n')
        .map(line => {
          return line ? line.split('\t') : [null, null];
        })
        .forEach(field => {
          const key = field[0];
          const value = field[1];
          if (key && value) {
            const trimmedKey = key.replace(':', '');
            const cleanValue = Number(value.replace(/\D/g, ''));
            procSelfStatusFields[trimmedKey] = cleanValue;
          }
        });
      return resolve({
        FDSize: procSelfStatusFields['FDSize'],
        Threads: procSelfStatusFields['Threads'],
        VmRSS: procSelfStatusFields['VmRSS']
      });
    });
  });
}

function readbootid() {
  return new Promise((resolve, reject) => {
    fs.readFile('/proc/sys/kernel/random/boot_id', function handleRead(
      err,
      data
    ) {
      return err ? reject(err) : resolve(data.toString());
    });
  });
}

module.exports = {
  readstat,
  readstatus,
  readbootid
};
