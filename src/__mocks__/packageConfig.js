let mockConfig = {};

function setConfig(config = {}) {
  mockConfig = config;
}

function getConfig() {
  return mockConfig;
}

function requireFromString() {
  return {};
}

module.exports = { getConfig, setConfig, requireFromString };
