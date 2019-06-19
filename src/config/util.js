import cosmiconfig from 'cosmiconfig';

/* Provides the `iopipe` object from main's `package.json` if it exists. Or returns values from an rc file if it exists. */
function getCosmiConfig() {
  try {
    const config = cosmiconfig('iopipe', {
      cache: false,
      sync: true,
      rcExtensions: true
    }).searchSync();

    if (config !== null) {
      return config.config;
    }
  } catch (err) {
    /*eslint-disable no-void*/
    void 0; // noop
  }

  return {};
}

/*
 * Attempts a require and instantiation from a given string.
 */
function requireFromString(src, args) {
  if (!src) {
    return undefined;
  }
  /*eslint-disable camelcase, no-undef*/
  /* webpack bug: https://github.com/webpack/webpack/issues/5939 */
  /* we should probably use guards like below, but we will skip them now due to the bug above*/
  // const load =
  //   typeof __non_webpack_require__ === 'function'
  //     ? __non_webpack_require__
  //     : require;
  try {
    const mod = __non_webpack_require__(src);
    /*eslint-enable camelcase, no-undef*/

    if (args && Array.isArray(args) && typeof mod === 'function') {
      return mod(...args);
    }

    if (typeof mod === 'function') {
      return mod();
    }

    return mod;
  } catch (err) {
    /*eslint-disable no-console*/
    console.warn(`Failed to import ${src}`);
    /*eslint-enable no-console*/
  }

  return undefined;
}

/*
 * Returns plugins, instantiating with arguments if provided.
 */
function getPlugins(plugins) {
  if (typeof plugins !== 'object' || !Array.isArray(plugins)) return undefined;

  return plugins
    .filter(Boolean)
    .map(plugin => {
      if (Array.isArray(plugin)) {
        // The array should have at least one item, which should be the
        // plugin package name.
        if (!plugin[0]) return undefined;

        return requireFromString(plugin[0], plugin.slice(1));
      } else if (typeof plugin === 'string') {
        return requireFromString(plugin);
      }
      return plugin;
    })
    .filter(plugin => typeof plugin !== 'undefined');
}

const setConfigPath = a => a;

export { getCosmiConfig, getPlugins, requireFromString, setConfigPath };
