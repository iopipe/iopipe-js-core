import CosmiConfig from './cosmi';

export default class EnvironmentConfig extends CosmiConfig {
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
