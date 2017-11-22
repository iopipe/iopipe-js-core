import collector from './../collector';

import DefaultConfig from './default';

const { getHostname, getCollectorPath } = collector;

export default class PackageConfig extends DefaultConfig {
  /**
   * Package.json configuration
   *
   * This class will attempt to load config values from an "iopipe" object if
   * found within the main package's package.json file.
   */

  constructor() {
    super();

    this._packageConfig = PackageConfig.getConfig();
  }

  get clientId() {
    return this._packageConfig.clientId || super.clientId;
  }

  get debug() {
    return this._packageConfig.debug &&
    typeof this._packageConfig.debug === 'boolean'
      ? this._packageConfig.debug
      : super.debug;
  }

  get host() {
    return this._packageConfig.url
      ? getHostname(this._packageConfig.url)
      : super.host;
  }

  get installMethod() {
    return this._packageConfig.installMethod || super.installMethod;
  }

  get networkTimeout() {
    return this._packageConfig.networkTimeout &&
    Number.isInteger(this._packageConfig.networkTimeout)
      ? this._packageConfig.networkTimeout
      : super.networkTimeout;
  }

  get path() {
    return this._packageConfig.url
      ? getCollectorPath(this._packageConfig.url)
      : super.path;
  }

  get plugins() {
    if (
      typeof this._packageConfig.plugins !== 'object' ||
      this._packageConfig.plugins.constructor !== Array
    )
      return super.plugins;

    return this._packageConfig.plugins
      .map(plugin => {
        if (Array.isArray(plugin)) {
          // The array should have at least one item, which should be the
          // plugin package name.
          if (!plugin[0]) return undefined;

          return PackageConfig.requireFromString(plugin[0], plugin.slice(1));
        }

        return PackageConfig.requireFromString(plugin);
      })
      .filter(plugin => typeof plugin !== 'undefined');
  }

  get timeoutWindow() {
    return this._packageConfig.timeoutWindow &&
    Number.isInteger(this._packageConfig.timeoutWindow)
      ? this._packageConfig.timeoutWindow
      : super.timeoutWindow;
  }

  /*
   * Returns the `iopipe` object from main's `package.json` if it exists.
   */
  static getConfig() {
    try {
      const packageConfig = require.main.require('./package');

      if (
        typeof packageConfig === 'object' &&
        typeof packageConfig.iopipe === 'object'
      ) {
        return packageConfig.iopipe;
      }
    } catch (err) {
      Function.prototype; // noop
    }

    return {};
  }

  /*
   * Attempts a require and instantiation from a given string.
   */
  static requireFromString(src, args) {
    try {
      const mod = require(src);

      if (args && args.constructor === Array) return mod.apply(null, args);

      return mod();
    } catch (err) {
      Function.prototype; // noop
    }

    return undefined;
  }
}
