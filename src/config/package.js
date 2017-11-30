import collector from './../collector';

import DefaultConfig from './default';
import { getPackageConfig, requireFromString } from './util';

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

    this._packageConfig = getPackageConfig();
  }

  get clientId() {
    return (
      this._packageConfig.token ||
      this._packageConfig.clientId ||
      super.clientId
    );
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

          return requireFromString(plugin[0], plugin.slice(1));
        }

        return requireFromString(plugin);
      })
      .filter(plugin => typeof plugin !== 'undefined');
  }

  get timeoutWindow() {
    return this._packageConfig.timeoutWindow &&
    Number.isInteger(this._packageConfig.timeoutWindow)
      ? this._packageConfig.timeoutWindow
      : super.timeoutWindow;
  }
}
