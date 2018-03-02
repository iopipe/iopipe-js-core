import collector from '../collector';

import EnvironmentConfig from './environment';

const { getHostname, getCollectorPath } = collector;

import { getPlugins, requireFromString } from './util';

const classConfig = Symbol('object');

export default class ObjectConfig extends EnvironmentConfig {
  /**
   * Config object configuration
   *
   * This class will accept a config object provided via agent instantiation
   * and will use any values that are present.
   */

  constructor(opts = {}) {
    super();

    const extendObject = requireFromString(opts.extends) || {};
    this[classConfig] = Object.assign({}, extendObject, opts);
    return this;
  }

  get clientId() {
    return (
      this[classConfig].token || this[classConfig].clientId || super.clientId
    );
  }

  get debug() {
    return this[classConfig].debug || super.debug;
  }

  get enabled() {
    return typeof this[classConfig].enabled === 'boolean'
      ? this[classConfig].enabled
      : super.enabled;
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
    return this[classConfig].networkTimeout || super.networkTimeout;
  }

  get path() {
    return this[classConfig].url
      ? getCollectorPath(this[classConfig].url)
      : super.path;
  }

  get plugins() {
    const plugins = [].concat(this[classConfig].plugins).concat(super.plugins);
    return getPlugins(plugins);
  }

  get timeoutWindow() {
    return Number.isInteger(this[classConfig].timeoutWindow)
      ? this[classConfig].timeoutWindow
      : super.timeoutWindow;
  }
}
