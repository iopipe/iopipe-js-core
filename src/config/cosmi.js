import collector from './../collector';

import ExtendConfig from './extend';
import { getCosmiConfig, getPlugins } from './util';

const { getHostname, getCollectorPath } = collector;

const classConfig = Symbol('cosmi');

export default class CosmiConfig extends ExtendConfig {
  /**
   * CosmiConfig configuration
   *
   * This class will attempt to load config values from an "iopipe" object if
   * found within the main package's package.json file. It will also attempt
   * to load values from an rc file if it exists.
   */

  constructor() {
    super();

    this[classConfig] = getCosmiConfig();
  }

  get clientId() {
    return (
      this[classConfig].token || this[classConfig].clientId || super.clientId
    );
  }

  get debug() {
    return this[classConfig].debug &&
    typeof this[classConfig].debug === 'boolean'
      ? this[classConfig].debug
      : super.debug;
  }

  get extends() {
    return this[classConfig] && this[classConfig].extends
      ? this[classConfig].extends
      : super.extends;
  }

  get host() {
    return this[classConfig].url
      ? getHostname(this[classConfig].url)
      : super.host;
  }

  get installMethod() {
    return this[classConfig].installMethod || super.installMethod;
  }

  get networkTimeout() {
    return this[classConfig].networkTimeout &&
    Number.isInteger(this[classConfig].networkTimeout)
      ? this[classConfig].networkTimeout
      : super.networkTimeout;
  }

  get path() {
    return this[classConfig].url
      ? getCollectorPath(this[classConfig].url)
      : super.path;
  }

  get plugins() {
    return getPlugins(this[classConfig].plugins) || super.plugins;
  }

  get timeoutWindow() {
    return this[classConfig].timeoutWindow &&
    Number.isInteger(this[classConfig].timeoutWindow)
      ? this[classConfig].timeoutWindow
      : super.timeoutWindow;
  }
}
