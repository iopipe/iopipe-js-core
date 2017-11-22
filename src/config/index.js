import Config from './config';

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

export default function setConfig(configObject) {
  return new Config(configObject);
}
