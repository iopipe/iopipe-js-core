let mockConfig = {};

function setConfig(config = {}) {
  mockConfig = config;
}

function getConfig() {
  return mockConfig;
}

function requireFromString() {
  return undefined;
}

module.exports = { getConfig, setConfig, requireFromString };
