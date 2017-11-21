import collector from './collector';
import packageConfig from './packageConfig';

const { getHostname, getCollectorPath } = collector;

/**
 * Config Loader
 *
 * These classes load the agent config from a number of sources. They use
 * class inheritance to determine precedence of config values.
 *
 * Precedence Order:
 *
 * 1. Agent instantiation object.
 * 2. IOPIPE_* environment variables.
 * 3. An IOpipe RC file.
 * 4. A package.json with an "iopipe" object.
 * 5. The default values set in DefaultConfig.
 */

class DefaultConfig {
  /**
   * Default configuration
   *
   * This class should define sensible defaults for any supported config
   * values.
   */

  get clientId() {
    return '';
  }

  get debug() {
    return false;
  }

  get host() {
    return getHostname();
  }

  get installMethod() {
    return 'manual';
  }

  get networkTimeout() {
    return 5000;
  }

  get path() {
    return getCollectorPath();
  }

  get plugins() {
    return [];
  }

  get timeoutWindow() {
    return 150;
  }
}

class PackageConfig extends DefaultConfig {
  /**
   * Package.json configuration
   *
   * This class will attempt to load config values from an "iopipe" object if
   * found within the main package's package.json file.
   */

  constructor() {
    super();

    this._packageConfig = packageConfig.getConfig();
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

          return packageConfig.requireFromString(plugin[0], plugin.slice(1));
        }

        return packageConfig.requireFromString(plugin);
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

class RcConfig extends PackageConfig {}

class EnvironmentConfig extends RcConfig {
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
      ? process.env.IOPIPE_DEBUG === '1' || process.env.IOPIPE_DEBUG === 'true'
      : super.debug;
  }

  get installMethod() {
    return process.env.IOPIPE_INSTALL_METHOD || super.installMethod;
  }

  get timeoutWindow() {
    return Number.isInteger(parseInt(process.env.IOPIPE_TIMEOUT_WINDOW, 10))
      ? parseInt(process.env.IOPIPE_TIMEOUT_WINDOW, 10)
      : super.timeoutWindow;
  }
}

class Config extends EnvironmentConfig {
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

module.exports = function setConfig(configObject) {
  return new Config(configObject);
};
