let configPath = undefined;

function getCosmiConfig() {
  try {
    const config = require(configPath);

    if (typeof config === 'object' && typeof config.iopipe === 'object') {
      return config.iopipe;
    }
  } catch (err) {
    Function.prototype; // noop
  }

  return {};
}

function requireFromString(src, args) {
  try {
    const mod = require(src);

    if (args && args.constructor === Array) return mod.apply(null, args);

    return mod();
  } catch (err) {
    Function.prototype; // noop
  }

  return undefined;
}

function setConfigPath(path) {
  configPath = path;
}

export { getCosmiConfig, requireFromString, setConfigPath };
