import collector from './../collector';

import DefaultConfig from './default';
import { getPlugins, requireFromString } from './util';

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
    return getPlugins(this[classConfig].plugins) || super.plugins;
  }

  get timeoutWindow() {
    return this[classConfig].timeoutWindow &&
    Number.isInteger(this[classConfig].timeoutWindow)
      ? this[classConfig].timeoutWindow
      : super.timeoutWindow;
  }
}
