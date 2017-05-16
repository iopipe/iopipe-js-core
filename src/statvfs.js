try {
  module.exports = import('./statvfs_diskusage')
} catch {
  module.exports = import('./statvfs_shell')
}
