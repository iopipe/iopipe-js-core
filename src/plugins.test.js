import _ from 'lodash';

import lib from './index';
import plugins from './plugins';
import TestPlugin from './plugins/test1';

test('Can instantiate a test plugin', done => {
  const plugin = TestPlugin({
    foo: 'bar'
  });

  const invocationInstance = {};
  const pluginInstance = plugin(invocationInstance);

  expect(pluginInstance.hasSetup).toEqual(false);

  done();
});

test('Can run a test plugin hook that modifies a invocation instance', done => {
  const plugin = TestPlugin({
    foo: 'bar'
  });

  const invocationInstance = { context: { iopipe: { log: _.noop } } };
  const pluginInstance = plugin(invocationInstance);

  expect(_.isFunction(invocationInstance.context.iopipe.trace)).toBe(false);
  pluginInstance.hooks['post:setup']();
  expect(pluginInstance.hasSetup).toEqual(true);
  expect(_.isFunction(invocationInstance.context.iopipe.trace)).toBe(true);

  done();
});

test('Can run a test plugin hook that adds items to the invocation metric array', done => {
  const plugin = TestPlugin({
    foo: 'bar'
  });

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
  expect(invocationInstance.metrics.length).toBe(2);
  expect(_.find(invocationInstance.metrics, { name: 'ding', s: 'dong' }));
  expect(_.find(invocationInstance.metrics, { name: 'metric-2', s: 'baz' }));

  done();
});
