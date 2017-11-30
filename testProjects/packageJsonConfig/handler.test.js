import _ from 'lodash';

const iopipe = require('./iopipe');

describe('Using package.json iopipe configuration', () => {
  beforeEach(() => {
    delete process.env.IOPIPE_TOKEN;
  });

  it('Has configuration', done => {
    iopipe({ networkTimeout: 345 })((event, context) => {
      try {
        const { clientId, networkTimeout, plugins } = context.iopipe.config;
        expect(clientId).toBe('package_json_config_token_wow');
        expect(networkTimeout).toBe(345);
        expect(plugins.length).toBe(1);
        expect(_.isFunction(plugins[0])).toBe(true);
        expect(_.isFunction(context.iopipe.mark.start)).toBe(true);
        done();
      } catch (err) {
        console.log(err);
      }
    })({}, {});
  });
});
