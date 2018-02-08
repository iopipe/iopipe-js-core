import _ from 'lodash';
import tracePlugin from '@iopipe/trace';
import CJSON from 'circular-json';

const iopipe = require('./iopipe');

class MockPlugin {
  constructor() {
    return this;
  }
  get meta() {
    return {
      name: 'mock-plugin'
    };
  }
}

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
        tracePlugin()
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
