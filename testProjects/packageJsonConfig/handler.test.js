import _ from 'lodash';

import { MockPlugin } from '../util/plugins';
import { resetEnv } from '../../util/testUtils';

const iopipe = require('./iopipe');

beforeEach(() => {
  resetEnv();
});

describe('Using package.json iopipe configuration', () => {
  test('Has configuration', done => {
    let inspectableInvocation;
    iopipe({
      networkTimeout: 345,
      plugins: [
        inv => {
          inspectableInvocation = inv;
          return new MockPlugin(inv);
        }
      ]
    })((event, context) => {
      try {
        const { clientId, networkTimeout } = context.iopipe.config;
        const { plugins } = inspectableInvocation;

        expect(clientId).toBe('package_json_config_token_wow');
        expect(networkTimeout).toBe(345);

        expect(_.map(plugins, 'meta.name')).toEqual([
          'mock-plugin',
          '@iopipe/trace'
        ]);

        expect(_.isFunction(context.iopipe.mark.start)).toBe(true);
        // the config should be "empty"...
        expect(_.isEmpty(context.iopipe.config)).toBe(true);
        // ...but we can get at them like this:
        const configs = _.chain(
          Object.getOwnPropertySymbols(context.iopipe.config)
        )
          .map(o => [o.toString(), context.iopipe.config[o]])
          .fromPairs()
          .value();
        expect(configs['Symbol(cosmi)'].token).toBe(
          'package_json_config_token_wow'
        );
        done();
      } catch (err) {
        console.log(err);
      }
    })({}, {});
  });
});
