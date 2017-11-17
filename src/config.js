import collector from './collector';
import packageConfig from './packageConfig';

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

  const packageConf = packageConfig.getConfig();
  if (packageConf) {
    Object.keys(config).forEach(key => {
      if (typeof packageConf[key] === 'undefined') return;

      if (key === 'url') {
        config.host = getHostname(packageConf[key]);
        config.path = getCollectorPath(packageConf[key]);
      } else if (key === 'plugins') {
        if (packageConf[key].constructor !== Array) return;

        config[key] = packageConf[key]
          .map(packageConfig.requireFromString)
          .filter(plugin => typeof plugin !== 'undefined');
      } else {
        config[key] = packageConf[key];
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
