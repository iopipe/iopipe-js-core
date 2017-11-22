let mockConfig = {};

function getPackageConfig() {
  return mockConfig;
}

const requireFromString = jest.fn().mockReturnValue({ name: 'iopipe' });

function setPackageConfig(config) {
  mockConfig = config;
}

export { getPackageConfig, requireFromString, setPackageConfig };
