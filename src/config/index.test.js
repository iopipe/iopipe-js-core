import { resetEnv } from '../../util/testUtils';
import setConfig from './index';
import { setConfigPath } from './util';

jest.mock('./util');
jest.mock('@iopipe/config', () => {
  return {
    plugins: []
  };
});

beforeEach(() => {
  resetEnv();
});

describe('setting up config object', () => {
  test('can accept 0 arguments and returns default config', async () => {
    const config = await setConfig();

    expect(config.clientId).toEqual('');

    expect(config.debug).toEqual(false);

    expect(config.enabled).toEqual(true);

    expect(config.host).toEqual('metrics-api.iopipe.com');

    expect(config.installMethod).toEqual('manual');

    expect(config.networkTimeout).toEqual(5000);

    expect(config.path).toEqual('/v0/event');

    expect(config.plugins).toEqual([]);

    expect(config.timeoutWindow).toEqual(150);
  });

  test('configures a client id', () => {
    expect(setConfig({ token: 'foo' }).clientId).toEqual('foo');

    expect(setConfig({ clientId: 'bar' }).clientId).toEqual('bar');
  });

  test('sets preferences for order of client id config', () => {
    // takes token over clientId
    expect(setConfig({ clientId: 'bar', token: 'foo' }).clientId).toEqual(
      'foo'
    );

    process.env.IOPIPE_CLIENTID = 'qux';

    expect(setConfig().clientId).toEqual('qux');

    // takes IOPIPE_TOKEN over IOPIPE_CLIENTID
    process.env.IOPIPE_TOKEN = 'baz';

    expect(setConfig().clientId).toEqual('baz');
  });

  test('sets timeout windows', () => {
    expect(setConfig({ timeoutWindow: 0 }).timeoutWindow).toEqual(0);

    process.env.IOPIPE_TIMEOUT_WINDOW = 100;

    expect(setConfig().timeoutWindow).toEqual(100);
    // prefers configuration over environment variables
    expect(setConfig({ timeoutWindow: 0 }).timeoutWindow).toEqual(0);
  });

  test('can be configured via config file', () => {
    setConfigPath('./package');

    const config = setConfig();
    // eslint-disable-next-line no-console
    console.log('configuring via config file', config);
    expect(config.clientId).toBe('foobar123');

    expect(config.debug).toBe(true);

    expect(config.host).toBe('foo.bar.baz.iopipe.com');

    expect(config[Symbol('cosmi')].plugins).toBeDefined();
    expect(config[Symbol('cosmi')].plugins).toHaveLength(1);

    expect(config.path).toBe('/foo/bar/v0/event');

    expect(config.timeoutWindow).toBe(100);

    // instantiation config overrides package.json config
    expect(setConfig({ clientId: 'barbaz' }).clientId).toBe('barbaz');

    process.env.IOPIPE_TOKEN = 'barbaz';

    // Environment variables override package config
    expect(setConfig().clientId).toBe('barbaz');
  });

  test('can disable agent', () => {
    expect(setConfig({ enabled: false }).enabled).toBe(false);
  });

  test('can disable agent via environment variable', () => {
    process.env.IOPIPE_ENABLED = '0';

    expect(setConfig().enabled).toBe(false);

    process.env.IOPIPE_ENABLED = 'false';

    expect(setConfig().enabled).toBe(false);
  });

  test('should only be disabled explicitly', () => {
    process.env.IOPIPE_ENABLED = 'xyz';

    expect(setConfig().enabled).toBe(true);

    process.env.IOPIPE_ENABLED = 'f';

    expect(setConfig().enabled).toBe(false);
  });
});
