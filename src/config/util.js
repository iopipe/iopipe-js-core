import cosmiconfig from 'cosmiconfig';

/**
 * Returns the `iopipe` object from main's `package.json` if it exists. Or returns values from an rc file if it exists.
 */
function getCosmiConfig() {
  try {
    const config = cosmiconfig('iopipe', {
      cache: false,
      sync: true,
      rcExtensions: true
    });

    const localConfig = config.load(process.cwd());

    if (localConfig && localConfig.config) {
      return localConfig.config;
    }

    const globalConfig = config.load(__dirname);

    if (globalConfig && globalConfig.config) {
      return globalConfig.config;
    }
  } catch (err) {
    void 0; // noop
  }

  return {};
}

/*
 * Attempts a require and instantiation from a given string.
 */
function requireFromString(src, args) {
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

    if (args && args.constructor === Array) return mod.apply(null, args);

    return mod();
  } catch (err) {
    void 0; // noop
  }

  return undefined;
}

export { getCosmiConfig, requireFromString };
