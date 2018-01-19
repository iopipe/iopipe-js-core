import collector from './../collector';

import DefaultConfig from './default';
import { getCosmiConfig, getPlugins, requireFromString } from './util';

const { getHostname, getCollectorPath } = collector;

const classConfig = Symbol('cosmi');
const extendConfig = Symbol('extend');

export default class CosmiConfig extends DefaultConfig {
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

    // This is used by the parent class
    this[extendConfig] = requireFromString(this.extends) || {};
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
    if (this[classConfig].url) return getHostname(this[classConfig].url);

    if (this[extendConfig].url) return getHostname(this[extendConfig].url);

    return super.host;
  }

  get installMethod() {
    if (this[classConfig].installMethod) return this[classConfig].installMethod;

    if (this[extendConfig].installMethod)
      return this[extendConfig].installMethod;

    return super.installMethod;
  }

  get networkTimeout() {
    if (
      this[classConfig].networkTimeout &&
      Number.isInteger(this[classConfig].networkTimeout)
    )
      return this[classConfig].networkTimeout;

    if (
      this[extendConfig].networkTimeout &&
      Number.isInteger(this[extendConfig].networkTimeout)
    )
      return this[extendConfig].networkTimeout;

    return super.networkTimeout;
  }

  get path() {
    if (this[classConfig].url) return getCollectorPath(this[classConfig].url);

    if (this[extendConfig].url) return getCollectorPath(this[extendConfig].url);

    return super.path;
  }

  get plugins() {
    if (this[classConfig].plugins) return getPlugins(this[classConfig].plugins);

    if (this[extendConfig].plugins)
      return getPlugins(this[extendConfig].plugins);

    return super.plugins;
  }

  get timeoutWindow() {
    if (
      this[classConfig].timeoutWindow &&
      Number.isInteger(this[classConfig].timeoutWindow)
    )
      return this[classConfig].timeoutWindow;

    if (
      this[extendConfig].timeoutWindow &&
      Number.isInteger(this[extendConfig].timeoutWindow)
    )
      return this[extendConfig].timeoutWindow;

    return super.timeoutWindow;
  }
}
