import url from 'url';
import { join } from 'path';
import { SUPPORTED_REGIONS } from './constants';

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
  let regionString = '';
  if (configUrl) {
    return url.parse(configUrl).hostname;
  }
  if (SUPPORTED_REGIONS.has(process.env.AWS_REGION)) {
    regionString = `.${process.env.AWS_REGION}`;
  }
  return `metrics-api${regionString}.iopipe.com`;
}

export { getHostname, getCollectorPath };
