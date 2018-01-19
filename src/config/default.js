import collector from './../collector';

const { getHostname, getCollectorPath } = collector;

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

  get extends() {
    return '@iopipe/config';
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
