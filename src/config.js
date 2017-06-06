const collector = require('./collector.js')
const getHostname = collector.getHostname,
  getCollectorPath = collector.getCollectorPath

module.exports = function setConfig(configObject) {
  return {
    url: (configObject && configObject.url) ? getHostname(configObject.url) : getHostname(),
    path: (configObject && configObject.url) ? getCollectorPath(configObject.url) : getCollectorPath(),
    clientId: configObject && (configObject.token || configObject.clientId) || process.env.IOPIPE_TOKEN || process.env.IOPIPE_CLIENTID || '',
    debug: configObject && configObject.debug || process.env.IOPIPE_DEBUG || false,
    networkTimeout: configObject && configObject.networkTimeout || 5000,
    timeoutWindow: configObject && configObject.timeoutWindow || 150,
    installMethod: configObject && configObject.installMethod || process.env.IOPIPE_INSTALL_METHOD || "manual"
  }
}
