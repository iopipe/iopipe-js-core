import collector from './collector';
import {
  getConfig as getPackageConfig,
  requireFromString
} from './packageConfig';

const { getHostname, getCollectorPath } = collector;

module.exports = function setConfig(configObject) {
  const defaults = {
    host: getHostname(),
    path: getCollectorPath(),
    clientId: process.env.IOPIPE_TOKEN || process.env.IOPIPE_CLIENTID || '',
    debug: process.env.IOPIPE_DEBUG || false,
    networkTimeout: 5000,
    timeoutWindow: Number(process.env.IOPIPE_TIMEOUT_WINDOW) || 150,
    installMethod: 'manual',
    plugins: []
  };

  const config = Object.assign({}, defaults);

  const packageConfig = getPackageConfig();
  if (packageConfig) {
    Object.keys(config).forEach(key => {
      if (typeof packageConfig[key] === 'undefined') return;

      if (key === 'url') {
        config.host = getHostname(packageConfig[key]);
        config.path = getCollectorPath(packageConfig[key]);
      } else if (key === 'plugins') {
        if (packageConfig[key].constructor !== Array) return;

        config[key] = packageConfig[key]
          .map(requireFromString)
          .filter(plugin => typeof plugin !== 'undefined');
      } else {
        config[key] = packageConfig[key];
      }
    });
  }

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
    config.plugins = configObject.plugins || defaults.plugins;
  }

  return config;
};
