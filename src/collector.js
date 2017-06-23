const url = require('url');
const path = require('path');

function getCollectorPath(baseUrl) {
  if (!baseUrl) {
    return '/v0/event';
  }
  const eventURL = url.parse(baseUrl);

  eventURL.pathname = path.join(eventURL.pathname, 'v0/event');
  eventURL.path = eventURL.search
    ? eventURL.pathname + eventURL.search
    : eventURL.pathname;
  return eventURL.path;
}

function getHostname(configUrl) {
  var regionString = '';
  if (configUrl) {
    return url.parse(configUrl).hostname;
  }
  const supportedRegions = [
    'ap-southeast-2',
    'eu-west-1',
    'us-east-2',
    'us-west-1',
    'us-west-2'
  ];
  if (supportedRegions.indexOf(process.env.AWS_REGION) > -1) {
    regionString = `.${process.env.AWS_REGION}`;
  }
  return `metrics-api${regionString}.iopipe.com`;
}

module.exports = {
  getHostname,
  getCollectorPath
};
