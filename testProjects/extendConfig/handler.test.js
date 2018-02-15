import _ from 'lodash';

import { MockPlugin } from '../util/plugins';

const iopipe = require('./iopipe');

describe('Using extend iopipe configuration', () => {
  beforeEach(() => {
    delete process.env.IOPIPE_TOKEN;
  });

  it('Has configuration', done => {
    let inspectableInvocation;
    iopipe({
      extends: '@iopipe/config',
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

        expect(plugins.length).toBe(2);

        const names = _.map(plugins, 'meta.name');
        expect(names).toEqual(['mock-plugin', '@iopipe/trace']);

        expect(_.isFunction(plugins[1].hooks['post:setup'])).toBe(true);

        expect(_.isFunction(context.iopipe.mark.start)).toBe(true);

        done();
      } catch (err) {
        console.log(err);
      }
    })({}, {});
  });
});
