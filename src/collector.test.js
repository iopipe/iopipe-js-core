import { resetEnv } from '../util/testUtils';
import { getHostname, getCollectorPath } from './collector';

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

  /*eslint-disable max-statements*/
  test('switches based on the region set in env vars', () => {
    process.env.AWS_REGION = 'ap-northeast-1';
    const apNortheast1Collector = getHostname('', {});

    process.env.AWS_REGION = 'ap-northeast-2';
    const apNortheast2Collector = getHostname('', {});

    process.env.AWS_REGION = 'ap-south-1';
    const apSouth1Collector = getHostname('', {});

    process.env.AWS_REGION = 'ap-southeast-1';
    const apSoutheast1Collector = getHostname('', {});

    process.env.AWS_REGION = 'ap-southeast-2';
    const apSoutheast2Collector = getHostname('', {});

    process.env.AWS_REGION = 'ca-central-1';
    const caCentral1Collector = getHostname('', {});

    process.env.AWS_REGION = 'eu-central-1';
    const euCentral1Collector = getHostname('', {});

    process.env.AWS_REGION = 'eu-west-1';
    const euWest1Collector = getHostname('', {});

    process.env.AWS_REGION = 'eu-west-2';
    const euWest2Collector = getHostname('', {});

    process.env.AWS_REGION = 'us-east-2';
    const east2Collector = getHostname('', {});

    process.env.AWS_REGION = 'us-west-1';
    const west1Collector = getHostname('', {});

    process.env.AWS_REGION = 'us-west-2';
    const west2Collector = getHostname('', {});

    expect(apNortheast1Collector).toBe('metrics-api.ap-northeast-1.iopipe.com');
    expect(apNortheast2Collector).toBe('metrics-api.ap-northeast-2.iopipe.com');
    expect(apSouth1Collector).toBe('metrics-api.ap-south-1.iopipe.com');
    expect(apSoutheast1Collector).toBe('metrics-api.ap-southeast-1.iopipe.com');
    expect(apSoutheast2Collector).toBe('metrics-api.ap-southeast-2.iopipe.com');
    expect(caCentral1Collector).toBe('metrics-api.ca-central-1.iopipe.com');
    expect(euCentral1Collector).toBe('metrics-api.eu-central-1.iopipe.com');
    expect(euWest1Collector).toBe('metrics-api.eu-west-1.iopipe.com');
    expect(euWest2Collector).toBe('metrics-api.eu-west-2.iopipe.com');
    expect(east2Collector).toBe('metrics-api.us-east-2.iopipe.com');
    expect(west1Collector).toBe('metrics-api.us-west-1.iopipe.com');
    expect(west2Collector).toBe('metrics-api.us-west-2.iopipe.com');
  });

  test('defaults if an uncovered region or malformed', () => {
    process.env.AWS_REGION = 'eu-west-3';
    const euWest3Collector = getHostname('', {});

    process.env.AWS_REGION = 'NotARegion';
    const notRegionCollector = getHostname('', {});

    process.env.AWS_REGION = '';
    const emptyRegionCollector = getHostname('', {});

    expect(euWest3Collector).toBe('metrics-api.iopipe.com');
    expect(notRegionCollector).toBe('metrics-api.iopipe.com');
    expect(emptyRegionCollector).toBe('metrics-api.iopipe.com');
  });
});

describe('configuring path', () => {
  test('adds query strings to the path', () => {
    expect(getCollectorPath('http://myurl?foo')).toBe('/v0/event?foo');
  });
});
