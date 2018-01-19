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

function getPlugins(plugins) {
  if (typeof plugins !== 'object' || !Array.isArray(plugins)) return undefined;

  return plugins
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

function setConfigPath(path) {
  configPath = path;
}

export { getCosmiConfig, getPlugins, requireFromString, setConfigPath };
