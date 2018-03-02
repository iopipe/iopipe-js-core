import collector from './../collector';

const { getHostname, getCollectorPath } = collector;

let iopipeConfig;
try {
  iopipeConfig = require('@iopipe/config');
} catch (err) {
  // noop
}

export default class DefaultConfig {
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

  get enabled() {
    return true;
  }

  get extends() {
    return iopipeConfig;
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
