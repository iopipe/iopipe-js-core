import collector from './../collector';

import DefaultConfig from './default';
import { getCosmiConfig, requireFromString } from './util';

const { getHostname, getCollectorPath } = collector;

const classConfig = Symbol('cosmi');

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
    if (
      typeof this[classConfig].plugins !== 'object' ||
      this[classConfig].plugins.constructor !== Array
    )
      return super.plugins;

    return this[classConfig].plugins
      .map(plugin => {
        if (Array.isArray(plugin)) {
          // The array should have at least one item, which should be the
          // plugin package name.
          if (!plugin[0]) return undefined;

          return requireFromString(plugin[0], plugin.slice(1));
        }

        return requireFromString(plugin);
      })
      .filter(plugin => typeof plugin !== 'undefined');
  }

  get timeoutWindow() {
    return this[classConfig].timeoutWindow &&
    Number.isInteger(this[classConfig].timeoutWindow)
      ? this[classConfig].timeoutWindow
      : super.timeoutWindow;
  }
}
