const collector = require('./collector.js');
const getHostname = collector.getHostname;
const getCollectorPath = collector.getCollectorPath;

module.exports = function setConfig(configObject) {
  const defaults = {
    host: getHostname(),
    path: getCollectorPath(),
    clientId: process.env.IOPIPE_TOKEN || process.env.IOPIPE_CLIENTID || '',
    debug: process.env.IOPIPE_DEBUG || false,
    networkTimeout: 5000,
    timeoutWindow: Number(process.env.IOPIPE_TIMEOUT_WINDOW) || 150,
    installMethod: 'manual'
  };

  const config = Object.assign({}, defaults);
  if (configObject) {
    if (configObject.url) {
      config.host = getHostname(configObject.url);
      config.path = getCollectorPath(configObject.url);
    }

    config.clientId =
      configObject.token || configObject.clientId || defaults.clientId;
    config.debug = configObject.debug || defaults.debug;
    config.timeoutWindow = Number.isInteger(configObject.timeoutWindow)
      ? configObject.timeoutWindow
      : defaults.timeoutWindow;
    config.installMethod =
      configObject.installMethod ||
      process.env.IOPIPE_INSTALL_METHOD ||
      defaults.installMethod;

    return config;
  }

  return defaults;
};
