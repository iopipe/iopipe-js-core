import cosmiconfig from 'cosmiconfig';

/**
 * Returns the `iopipe` object from main's `package.json` if it exists.
 */
function getPackageConfig() {
  try {
    const packageConfig = cosmiconfig('iopipe', {
      cache: false,
      js: false,
      sync: true,
      rc: false
    }).load(process.cwd());

    if (packageConfig !== null) {
      return packageConfig.config;
    }
  } catch (err) {
    void 0; // noop
  }

  return {};
}

/**
 * Returns the rc config if it exists.
 */
function getRcConfig() {
  try {
    const rcConfig = cosmiconfig('iopipe', {
      cache: false,
      js: false,
      packageProp: false,
      sync: true,
      rcExtensions: true
    }).load(process.cwd());

    if (rcConfig !== null) {
      return rcConfig.config;
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

export { getPackageConfig, getRcConfig, requireFromString };
