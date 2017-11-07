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

  return {};
}

export { getConfig };
