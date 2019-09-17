import CosmiConfig from './cosmi';

const url = require('url');

export default class EnvironmentConfig extends CosmiConfig {
  /**
   * Environment variable configuration
   *
   * This class will look for IOPIPE_* environment variables and will atempt
   * to load them if present.
   */

  get clientId() {
    return (
      process.env.IOPIPE_TOKEN || process.env.IOPIPE_CLIENTID || super.clientId
    );
  }

  get debug() {
    return process.env.IOPIPE_DEBUG
      ? ['true', 't', '1'].indexOf(
          process.env.IOPIPE_DEBUG.toString().toLowerCase()
        ) !== -1
      : super.debug;
  }

  get enabled() {
    return process.env.IOPIPE_ENABLED
      ? ['false', 'f', '0'].indexOf(
          process.env.IOPIPE_ENABLED.toString().toLowerCase()
        ) === -1
      : super.enabled;
  }

  get host() {
    return process.env.IOPIPE_COLLECTOR_URL
      ? url.parse(process.env.IOPIPE_COLLECTOR_URL).hostname
      : super.host;
  }

  get installMethod() {
    return process.env.IOPIPE_INSTALL_METHOD || super.installMethod;
  }

  get networkTimeout() {
    return Number.isInteger(parseInt(process.env.IOPIPE_NETWORK_TIMEOUT, 10))
      ? parseInt(process.env.IOPIPE_NETWORK_TIMEOUT, 10)
      : super.networkTimeout;
  }

  get path() {
    return process.env.IOPIPE_COLLECTOR_URL
      ? url.parse(process.env.IOPIPE_COLLECTOR_URL).pathname
      : super.path;
  }

  get proxyIntegration() {
    return process.env.IOPIPE_PROXY_INTEGRATION || false;
  }

  get timeoutWindow() {
    return Number.isInteger(parseInt(process.env.IOPIPE_TIMEOUT_WINDOW, 10))
      ? parseInt(process.env.IOPIPE_TIMEOUT_WINDOW, 10)
      : super.timeoutWindow;
  }
}
