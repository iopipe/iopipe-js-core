import collector from './collector';
import packageConfig from './packageConfig';

const { getHostname, getCollectorPath } = collector;

module.exports = function setConfig(configObject) {
  const defaults = {
    clientId: '',
    debug: false,
    host: getHostname(),
    installMethod: 'manual',
    networkTimeout: 5000,
    path: getCollectorPath(),
    plugins: [],
    timeoutWindow: 150
  };

  const config = Object.assign({}, defaults);

  const packageConf = packageConfig.getConfig();

  // Override default config with package config variables
  if (packageConf) {
    Object.keys(config).forEach(key => {
      if (typeof packageConf[key] === 'undefined') return;

      switch (key) {
        case 'url':
          config.host = getHostname(packageConf[key]);
          config.path = getCollectorPath(packageConf[key]);
          break;
        case 'debug':
          config[key] =
            typeof packageConf[key] === 'boolean'
              ? packageConf[key]
              : config[key];
          break;
        case 'plugins':
          config[key] =
            packageConf[key].constructor === Array
              ? packageConf[key]
                  .map(packageConfig.requireFromString)
                  .filter(plugin => typeof plugin !== 'undefined')
              : config[key];
          break;
        case 'timeoutWindow':
          config[key] = !Number.isInteger(packageConf[key])
            ? packageConfig[key]
            : config[key];
          break;
        default:
          config[key] = packageConf[key];
      }
    });
  }

  // Override default and package config with environment variables
  config.clientId =
    process.env.IOPIPE_TOKEN || process.env.IOPIPE_CLIENTID || config.clientId;
  config.debug =
    process.env.IOPIPE_DEBUG === '1' ||
    process.env.IOPIPE_DEBUG === 'true' ||
    config.debug;
  config.installMethod =
    process.env.IOPIPE_INSTALL_METHOD || config.installMethod;
  config.timeoutWindow = Number.isInteger(
    parseInt(process.env.IOPIPE_TIMEOUT_WINDOW, 10)
  )
    ? parseInt(process.env.IOPIPE_TIMEOUT_WINDOW, 10)
    : config.timeoutWindow;

  // Override default, package and env config with instantiation config
  if (configObject) {
    if (configObject.url) {
      config.host = getHostname(configObject.url);
      config.path = getCollectorPath(configObject.url);
    }

    config.clientId =
      configObject.token || configObject.clientId || config.clientId;
    config.debug = configObject.debug || defaults.debug;
    config.timeoutWindow = Number.isInteger(configObject.timeoutWindow)
      ? configObject.timeoutWindow
      : config.timeoutWindow;
    config.installMethod = configObject.installMethod || config.installMethod;
    config.plugins = configObject.plugins || config.plugins;
  }

  return config;
};
