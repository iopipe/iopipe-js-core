/*eslint-disable import/no-extraneous-dependencies*/
import _ from 'lodash';

import { MockPlugin } from '../util/plugins';
import { resetEnv } from '../../util/testUtils';

const iopipe = require('./iopipe');

beforeEach(() => {
  resetEnv();
});

describe('Using extend iopipe configuration', () => {
  test('Has configuration', done => {
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

        expect(plugins).toHaveLength(2);

        const names = _.map(plugins, 'meta.name');
        expect(names).toEqual(['mock-plugin', '@iopipe/trace']);

        expect(_.isFunction(plugins[1].hooks['post:setup'])).toBe(true);

        expect(_.isFunction(context.iopipe.mark.start)).toBe(true);

        done();
      } catch (err) {
        throw err;
      }
    })({}, {});
  });
});
