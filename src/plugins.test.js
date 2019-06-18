import _ from 'lodash';
import mockContext from 'aws-lambda-mock-context';

import { reports } from './sendReport';
import { hooks } from './hooks';

import mockPlugin from './plugins/mock';
import {
  instantiate as allHooksPlugin,
  data as allHooksData
} from './plugins/allHooks';

jest.mock('./sendReport');

const iopipeLib = require('./index');

test('Hooks have not changed', () => {
  expect(hooks).toHaveLength(6);
  expect(hooks).toMatchSnapshot();
});

test('Can instantiate a test plugin', done => {
  const plugin = mockPlugin();

  const invocationInstance = {};
  const pluginInstance = plugin(invocationInstance);

  expect(pluginInstance.hasSetup).toEqual(false);

  done();
});

test('Can instantiate a test plugin with config', done => {
  const plugin = mockPlugin({
    foo: 'bar'
  });

  const invocationInstance = {};
  const pluginInstance = plugin(invocationInstance);

  expect(pluginInstance.config.foo).toEqual('bar');

  done();
});

test('Can call a plugin hook function', done => {
  const plugin = mockPlugin();

  const invocationInstance = {
    context: {
      iopipe: {}
    }
  };
  const pluginInstance = plugin(invocationInstance);

  expect(pluginInstance.hasSetup).toBe(false);
  pluginInstance.hooks['post:setup'](invocationInstance);
  expect(pluginInstance.hasSetup).toBe(true);

  done();
});

test('Can run a test plugin hook that modifies a invocation instance', done => {
  const plugin = mockPlugin();

  const invocationInstance = { context: { iopipe: { log: _.noop } } };
  const pluginInstance = plugin(invocationInstance);

  expect(_.isFunction(invocationInstance.context.iopipe.mock)).toBe(false);
  pluginInstance.hooks['post:setup']();
  expect(pluginInstance.hasSetup).toEqual(true);
  expect(_.isFunction(invocationInstance.context.iopipe.mock)).toBe(true);

  done();
});

test('Can run a test plugin hook directly', async done => {
  const plugin = mockPlugin();

  const invocationInstance = {
    metrics: [
      {
        name: 'ding',
        s: 'dong'
      }
    ],
    context: {
      iopipe: {}
    },
    report: {
      report: {}
    }
  };
  const pluginInstance = plugin(invocationInstance);

  pluginInstance.hooks['post:setup']();
  invocationInstance.context.iopipe.mock('metric-2', 'baz');
  await pluginInstance.hooks['pre:invoke']();
  await pluginInstance.hooks['post:invoke']();
  const { metrics } = invocationInstance;
  expect(metrics).toHaveLength(2);
  expect(
    _.find(metrics, m => m.name === 'ding' && m.s === 'dong')
  ).toBeTruthy();
  expect(
    _.find(metrics, m => m.name === 'mock-metric-2' && m.s === 'baz')
  ).toBeTruthy();
  expect(
    _.get(invocationInstance, 'report.report.asyncHookFired')
  ).toBeTruthy();
  expect(
    _.get(invocationInstance, 'report.report.promiseHookFired')
  ).toBeTruthy();

  done();
});

test('A single plugin can be loaded and work', async () => {
  try {
    const iopipe = await iopipeLib({
      token: 'single-plugin',
      plugins: [mockPlugin()]
    });

    const wrapped = iopipe((event, ctx) => {
      ctx.iopipe.mock('ok', 'neat');
      ctx.succeed(ctx.iopipe.mock);
    });

    const context = mockContext();

    wrapped({}, context);

    const val = await context.Promise;
    expect(_.isFunction(val)).toBe(true);

    const metric = _.chain(reports)
      .find(obj => obj.client_id === 'single-plugin')
      .get('custom_metrics')
      .find({ name: 'mock-ok', s: 'neat' })
      .value();
    expect(_.isObject(metric)).toBe(true);

    const asyncHookFired = _.chain(reports)
      .find(obj => obj.client_id === 'single-plugin')
      .get('asyncHookFired')
      .value();
    expect(asyncHookFired).toBeTruthy();

    const plugin = _.chain(reports)
      .find(obj => obj.client_id === 'single-plugin')
      .get('plugins')
      .find({
        name: 'mock',
        version: '0.0.1',
        homepage: 'https://github.com/not/a/real/plugin'
      })
      .value();

    expect(_.isObject(plugin)).toBe(true);
  } catch (err) {
    throw err;
  }
});

test('Multiple plugins can be loaded and work', async () => {
  try {
    const iopipe = await iopipeLib({
      token: 'multiple-plugins',
      plugins: [
        mockPlugin(),
        mockPlugin({
          name: 'secondMockPlugin',
          functionName: 'secondmock'
        })
      ]
    });

    const wrapped = await iopipe((event, ctx) => {
      ctx.iopipe.mock('ok', 'neat');
      ctx.iopipe.secondmock('foo', 'bar');
      ctx.succeed('indeed');
    });

    const context = mockContext();

    wrapped({}, context);

    const val = await context.Promise;
    expect(val).toBe('indeed');

    const metrics = _.chain(reports)
      .find(obj => obj.client_id === 'multiple-plugins')
      .get('custom_metrics')
      .value();
    expect(_.isArray(metrics)).toBe(true);
    expect(metrics).toHaveLength(2);
    expect(metrics).toMatchSnapshot();
  } catch (err) {
    throw err;
  }
});

test('All hooks are called successfully when a plugin uses them all', async () => {
  try {
    const iopipe = await iopipeLib({
      token: 'single-plugin',
      plugins: [allHooksPlugin()]
    });

    const wrapped = await iopipe((event, ctx) => {
      return ctx.succeed(ctx);
    });

    const context = mockContext();
    wrapped({}, context);

    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    _.reject(hooks, h => h === 'pre:setup').map(hook => {
      return expect(context[`hasRun:${hook}`]).toBe(true);
    });
    expect(allHooksData).toMatchSnapshot();
  } catch (err) {
    throw err;
  }
});
