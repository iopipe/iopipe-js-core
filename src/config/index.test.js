import setConfig from './index';

jest.mock('./util');

import { requireFromString, setPackageConfig } from './util';

describe('setting up config object', () => {
  beforeEach(() => {
    delete process.env.IOPIPE_TOKEN;
    delete process.env.IOPIPE_CLIENTID;
    delete process.env.IOPIPE_TIMEOUT_WINDOW;
    delete process.env.AWS_REGION;
  });

  it('can accept 0 arguments and returns default config', () => {
    const config = setConfig();

    expect(config.clientId).toEqual('');

    expect(config.debug).toEqual(false);

    expect(config.host).toEqual('metrics-api.iopipe.com');

    expect(config.installMethod).toEqual('manual');

    expect(config.networkTimeout).toEqual(5000);

    expect(config.path).toEqual('/v0/event');

    expect(config.plugins).toEqual([]);

    expect(config.timeoutWindow).toEqual(150);
  });

  it('configures a client id', () => {
    expect(setConfig({ token: 'foo' }).clientId).toEqual('foo');

    expect(setConfig({ clientId: 'bar' }).clientId).toEqual('bar');
  });

  it('sets preferences for order of client id config', () => {
    // takes token over clientId
    expect(setConfig({ clientId: 'bar', token: 'foo' }).clientId).toEqual(
      'foo'
    );

    process.env['IOPIPE_CLIENTID'] = 'qux';

    expect(setConfig().clientId).toEqual('qux');

    // takes IOPIPE_TOKEN over IOPIPE_CLIENTID
    process.env['IOPIPE_TOKEN'] = 'baz';

    expect(setConfig().clientId).toEqual('baz');
  });

  it('sets timeout windows', () => {
    expect(setConfig({ timeoutWindow: 0 }).timeoutWindow).toEqual(0);

    process.env.IOPIPE_TIMEOUT_WINDOW = 100;

    expect(setConfig().timeoutWindow).toEqual(100);
    // prefers configuration over environment variables
    expect(setConfig({ timeoutWindow: 0 }).timeoutWindow).toEqual(0);
  });

  it('can be configured via package.json', () => {
    setPackageConfig({ clientId: 'foobar' });

    expect(setConfig().clientId).toBe('foobar');

    // instantiation config overrides package.json config
    expect(setConfig({ clientId: 'barbaz' }).clientId).toBe('barbaz');

    process.env.IOPIPE_TOKEN = 'barbaz';

    // Environment variables override package config
    expect(setConfig().clientId).toBe('barbaz');

    setPackageConfig({ debug: 'not-a-boolean' });

    expect(setConfig().debug).toBe(false);

    setPackageConfig({ timeoutWindow: 'not-a-integer' });

    expect(setConfig().timeoutWindow).toEqual(150);

    setPackageConfig({ plugins: ['iopipe'] });

    expect(setConfig().plugins.length).toBe(1);

    expect(requireFromString).toBeCalledWith('iopipe');
  });
});
