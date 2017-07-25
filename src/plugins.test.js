import _ from 'lodash';
import mockContext from 'aws-lambda-mock-context';

import IOpipe from './index';

jest.mock('./sendReport');
import { reports } from './sendReport';
import { hooks } from './hooks';

import TracePlugin from './plugins/trace';
import {
  instantiate as AllHooksPlugin,
  data as allHooksData
} from './plugins/allHooks';

test('Hooks have not changed', () => {
  expect(hooks.length).toEqual(6);
  expect(hooks).toMatchSnapshot();
});

test('Can instantiate a test plugin', done => {
  const plugin = TracePlugin();

  const invocationInstance = {};
  const pluginInstance = plugin(invocationInstance);

  expect(pluginInstance.hasSetup).toEqual(false);

  done();
});

test('Can instantiate a test plugin with config', done => {
  const plugin = TracePlugin({
    foo: 'bar'
  });

  const invocationInstance = {};
  const pluginInstance = plugin(invocationInstance);

  expect(pluginInstance.config.foo).toEqual('bar');

  done();
});

test('Can call a plugin hook function', done => {
  const plugin = TracePlugin();

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
  const plugin = TracePlugin();

  const invocationInstance = { context: { iopipe: { log: _.noop } } };
  const pluginInstance = plugin(invocationInstance);

  expect(_.isFunction(invocationInstance.context.iopipe.trace)).toBe(false);
  pluginInstance.hooks['post:setup']();
  expect(pluginInstance.hasSetup).toEqual(true);
  expect(_.isFunction(invocationInstance.context.iopipe.trace)).toBe(true);

  done();
});

test('Can run a test plugin hook directly', done => {
  const plugin = TracePlugin();

  const invocationInstance = {
    metrics: [
      {
        name: 'ding',
        s: 'dong'
      }
    ],
    context: {
      iopipe: {}
    }
  };
  const pluginInstance = plugin(invocationInstance);

  pluginInstance.hooks['post:setup']();
  invocationInstance.context.iopipe.trace('metric-2', 'baz');
  const { metrics } = invocationInstance;
  expect(metrics.length).toBe(2);
  expect(
    _.find(metrics, m => m.name === 'ding' && m.s === 'dong')
  ).toBeTruthy();
  expect(
    _.find(metrics, m => m.name === 'trace-metric-2' && m.s === 'baz')
  ).toBeTruthy();

  done();
});

test('A single plugin can be loaded and work', async () => {
  try {
    const iopipe = IOpipe({
      token: 'single-plugin',
      plugins: [TracePlugin()]
    });

    const wrapped = iopipe((event, ctx) => {
      ctx.iopipe.trace('ok', 'neat');
      ctx.succeed(ctx.iopipe.trace);
    });

    const context = mockContext();

    wrapped({}, context);

    const val = await context.Promise;
    expect(_.isFunction(val)).toBe(true);

    const metric = _.chain(reports)
      .find(obj => obj.client_id === 'single-plugin')
      .get('custom_metrics')
      .find({ name: 'trace-ok', s: 'neat' })
      .value();
    expect(_.isObject(metric)).toBe(true);
  } catch (err) {
    console.error(err);
    throw err;
  }
});

test('Multiple plugins can be loaded and work', async () => {
  try {
    const iopipe = IOpipe({
      token: 'multiple-plugins',
      plugins: [
        TracePlugin(),
        TracePlugin({
          functionName: 'secondTrace'
        })
      ]
    });

    const wrapped = iopipe((event, ctx) => {
      ctx.iopipe.trace('ok', 'neat');
      ctx.iopipe.secondTrace('foo', 'bar');
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
    expect(_.isArray(metrics));
    expect(metrics.length).toBe(2);
    expect(metrics).toMatchSnapshot();
  } catch (err) {
    console.error(err);
    throw err;
  }
});

test('The AllHooks plugin works', async () => {
  try {
    const iopipe = IOpipe({
      token: 'single-plugin',
      plugins: [AllHooksPlugin()]
    });

    const wrapped = iopipe((event, ctx) => {
      ctx.succeed(ctx);
    });

    const context = mockContext();

    wrapped({}, context);

    const val = await context.Promise;
    _.reject(hooks, h => h === 'pre:setup').map(hook => {
      expect(val[`hasRun:${hook}`]).toBe(true);
    });
    expect(allHooksData).toMatchSnapshot();
  } catch (err) {
    console.error(err);
    throw err;
  }
});
