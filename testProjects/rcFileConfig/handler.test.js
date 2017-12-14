import _ from 'lodash';

const iopipe = require('./iopipe');

describe('Using rc file iopipe configuration', () => {
  beforeEach(() => {
    delete process.env.IOPIPE_TOKEN;
  });

  it('Has configuration', done => {
    iopipe({ networkTimeout: 345 })((event, context) => {
      try {
        const { clientId, networkTimeout, plugins } = context.iopipe.config;

        expect(clientId).toBe('rc_file_config_token_wow');

        expect(networkTimeout).toBe(345);

        expect(plugins.length).toBe(1);

        expect(_.isFunction(plugins[0])).toBe(true);

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

        expect(configs['Symbol(cosmi)'].token).toBe('rc_file_config_token_wow');
        done();
      } catch (err) {
        console.log(err);
      }
    })({}, {});
  });
});
