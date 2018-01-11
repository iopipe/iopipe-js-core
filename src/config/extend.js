import collector from './../collector';

import DefaultConfig from './default';
import { requireFromString } from './util';

const { getHostname, getCollectorPath } = collector;

const classConfig = Symbol('extend');

export default class ExtendConfig extends DefaultConfig {
  /**
   * Extend Configuration
   *
   * This loader allows defaults to be extended from a specified package.
   */

  constructor() {
    super();
    this[classConfig] = requireFromString(this.extends) || {};
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
