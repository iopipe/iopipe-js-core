let packageJsonPath = undefined;

function getPackageConfig() {
  try {
    const packageConfig = require(packageJsonPath);

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

function setPackageJsonPath(path) {
  packageJsonPath = path;
}

export { getPackageConfig, requireFromString, setPackageJsonPath };
