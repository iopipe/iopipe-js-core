function readstat(pid) {
  return Promise.join(
    fs.readFileAsync(`/proc/${pid}/stat`)
  ).spread((
    pre_proc_self_stat_file
  ) => {
    var pre_proc_self_stat_fields = pre_proc_self_stat_file.toString().split(" ")
    return {
      utime: pre_proc_self_stat_fields[13],
      stime: pre_proc_self_stat_fields[14],
      cutime: pre_proc_self_stat_fields[15],
      cstime: pre_proc_self_stat_fields[16],
      rss: pre_proc_self_stat_fields[23]
    }
  })
}

function readstatus(pid) {
  return Promise.join(
    fs.readFileAsync(`/proc/${pid}/status`)
  ).spread((
    proc_self_status_file
  ) => {
    var proc_self_status_fields = {};
    // Parse status file and apply to the proc_self_status_fields dict.
    proc_self_status_file.toString().split("\n").map(
      (x) => {
        return (x) ? x.split("\t") : [ null, null ]
      }
    ).forEach(
      (x) => { proc_self_status_fields[x[0]] = x[1] }
    )

    return {
      FDSize: proc_self_status_fields['FDSize'],
      Threads: proc_self_status_fields['Threads'],
      VmRSS: proc_self_status_fields['VmRSS'],
      VmData: proc_self_status_fields['VmData'],
      VmStk: proc_self_status_fields['VmStk'],
      VmExe: proc_self_status_fields['VmExe'],
      VmSwap: proc_self_status_fields['VmSwap']
    }
  })
}

function readbootid() {
  return fs.readFileAsync('/proc/sys/kernel/random/boot_id')
}

module.exports = {
  readstat,
  readstatus,
  readbootid
}
