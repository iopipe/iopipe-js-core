import collector from '../collector';

import EnvironmentConfig from './environment';

const { getHostname, getCollectorPath } = collector;

export default class Config extends EnvironmentConfig {
  /**
   * Config object configuration
   *
   * This class will accept a config object provided via agent instantiation
   * and will use any values that are present.
   */

  constructor(config = {}) {
    super();

    this._config = config;
  }

  get clientId() {
    return this._config.token || this._config.clientId || super.clientId;
  }

  get debug() {
    return this._config.debug || super.debug;
  }

  get host() {
    return this._config.url ? getHostname(this._config.url) : super.host;
  }

  get installMethod() {
    return this._config.installMethod || super.installMethod;
  }

  get networkTimeout() {
    return this._config.networkTimeout || super.networkTimeout;
  }

  get path() {
    return this._config.url ? getCollectorPath(this._config.url) : super.path;
  }

  get plugins() {
    return Array.isArray(this._config.plugins)
      ? this._config.plugins
      : super.plugins;
  }

  get timeoutWindow() {
    return Number.isInteger(this._config.timeoutWindow)
      ? this._config.timeoutWindow
      : super.timeoutWindow;
  }
}
