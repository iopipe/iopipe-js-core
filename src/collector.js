import url from 'url';
import { join } from 'path';

function getCollectorPath(baseUrl) {
  if (!baseUrl) {
    return '/v0/event';
  }
  const eventURL = url.parse(baseUrl);
  eventURL.pathname = join(eventURL.pathname, 'v0/event');
  const { pathname, search } = eventURL;

  eventURL.pathname = join(pathname, 'v0/event');
  eventURL.path = search ? pathname + search : pathname;
  return eventURL.path;
}

function getHostname(configUrl) {
  var regionString = '';
  if (configUrl) {
    return url.parse(configUrl).hostname;
  }
  const supportedRegions = [
    'ap-northeast-1'
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
