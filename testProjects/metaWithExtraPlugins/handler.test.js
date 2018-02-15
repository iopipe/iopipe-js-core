import _ from 'lodash';

import { MockPlugin, MockTracePlugin } from '../util/plugins';

const iopipe = require('./iopipe');

describe('Meta with extra plugin, no deduping', () => {
  beforeEach(() => {
    delete process.env.IOPIPE_TOKEN;
  });

  it('Has configuration', done => {
    let inspectableInvocation;
    iopipe({
      clientId: 'foobar',
      plugins: [
        inv => {
          inspectableInvocation = inv;
          return new MockPlugin(inv);
        }
      ]
    })((event, context) => {
      try {
        const { config } = context.iopipe;
        const { plugins } = inspectableInvocation;

        expect(config.extends).toBe('@iopipe/config');

        const names = _.chain(plugins)
          .map(p => p.meta.name)
          .value();

        expect(plugins.length).toBe(2);
        expect(names).toEqual(['mock-plugin', '@iopipe/trace']);

        expect(_.isFunction(context.iopipe.mark.start)).toBe(true);

        done();
      } catch (err) {
        console.log(err);
      }
    })({}, {});
  });
});

describe('Meta with extra plugin, dedupes trace plugin', () => {
  /* When a consumer provides their own plugins, the plugins should be deduped via the meta.name string. If a consumer provides a duplicate with the same meta.name, their plugin should be used instead of the default. */
  beforeEach(() => {
    delete process.env.IOPIPE_TOKEN;
  });

  it('Has configuration', done => {
    let inspectableInvocation;
    iopipe({
      clientId: 'foobar',
      plugins: [
        inv => {
          inspectableInvocation = inv;
          return new MockPlugin(inv);
        },
        inv => new MockTracePlugin(inv)
      ]
    })((event, context) => {
      try {
        const { config } = context.iopipe;
        const { plugins } = inspectableInvocation;

        expect(config.extends).toBe('@iopipe/config');

        const names = _.chain(plugins)
          .map(p => p.meta.name)
          .value();

        expect(plugins.length).toBe(2);
        expect(names).toEqual(['mock-plugin', '@iopipe/trace']);
        expect(plugins[1].meta.version).toBe('mocked-trace');

        done();
      } catch (err) {
        console.log(err);
      }
    })({}, {});
  });
});
