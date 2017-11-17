/*
 * Returns the `iopipe` object from main's `package.json` if it exists.
 */
function getConfig() {
  try {
    const packageConfig = require.main.require('./package');

    if (
      typeof packageConfig === 'object' &&
      typeof packageConfig.iopipe === 'object'
    ) {
      return packageConfig.iopipe;
    }
  } catch (err) {
    Function.prototype; // noop
  }

  return undefined;
}

/*
 * Attempts a require and instantiation from a given string.
 */
function requireFromString(src) {
  try {
    return require(src)();
  } catch (err) {
    Function.prototype; // noop
  }

  return undefined;
}

module.exports = { getConfig, requireFromString };
