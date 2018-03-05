import collector from './collector';
const { getHostname, getCollectorPath } = collector;

import { resetEnv } from '../util/testUtils';

describe('configuring collector hostname', () => {
  beforeEach(() => {
    resetEnv();
  });

  test('returns a base hostname if nothing else', () => {
    expect(getHostname()).toBe('metrics-api.iopipe.com');
  });

  test('returns a configured url if provided in config object', () => {
    expect(getHostname('http://myurl')).toBe('myurl');
  });

  test('switches based on the region set in env vars', () => {
    process.env.AWS_REGION = 'ap-southeast-2';
    let apSoutheast2Collector = getHostname('', {});
    process.env.AWS_REGION = 'eu-west-1';
    let euWest1Collector = getHostname('', {});
    process.env.AWS_REGION = 'us-east-2';
    let east2Collector = getHostname('', {});
    process.env.AWS_REGION = 'us-west-1';
    let west1Collector = getHostname('', {});
    process.env.AWS_REGION = 'us-west-2';
    let west2Collector = getHostname('', {});

    expect(apSoutheast2Collector).toBe('metrics-api.ap-southeast-2.iopipe.com');
    expect(euWest1Collector).toBe('metrics-api.eu-west-1.iopipe.com');
    expect(east2Collector).toBe('metrics-api.us-east-2.iopipe.com');
    expect(west1Collector).toBe('metrics-api.us-west-1.iopipe.com');
    expect(west2Collector).toBe('metrics-api.us-west-2.iopipe.com');
  });

  test('defaults if an uncovered region or malformed', () => {
    process.env.AWS_REGION = 'eu-west-2';
    let euWest2Collector = getHostname('', {});

    process.env.AWS_REGION = 'NotARegion';
    let notRegionCollector = getHostname('', {});

    process.env.AWS_REGION = '';
    let emptyRegionCollector = getHostname('', {});

    expect(euWest2Collector).toBe('metrics-api.iopipe.com');
    expect(notRegionCollector).toBe('metrics-api.iopipe.com');
    expect(emptyRegionCollector).toBe('metrics-api.iopipe.com');
  });
});

describe('configuring path', () => {
  test('adds query strings to the path', () => {
    expect(getCollectorPath('http://myurl?foo')).toBe('/v0/event?foo');
  });
});
