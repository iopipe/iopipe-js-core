let mockConfig = {};

function setConfig(config = {}) {
  mockConfig = config;
}

function getConfig() {
  return mockConfig;
}

export { getConfig, setConfig };
