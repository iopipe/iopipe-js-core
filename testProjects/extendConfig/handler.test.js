import _ from 'lodash';

const iopipe = require('./iopipe');

describe('Using extend iopipe configuration', () => {
  beforeEach(() => {
    delete process.env.IOPIPE_TOKEN;
  });

  it('Has configuration', done => {
    iopipe({ clientId: 'foobar' })((event, context) => {
      try {
        const { plugins } = context.iopipe.config;

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
