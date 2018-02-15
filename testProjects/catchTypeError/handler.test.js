import _ from 'lodash';
import delay from 'delay';

const iopipe = require('./iopipe');

describe('Catch typeError by wrapping require block', () => {
  beforeEach(() => {
    delete process.env.IOPIPE_TOKEN;
  });

  it('Has configuration', async () => {
    let inspectableInvocation;
    iopipe({
      token: 'test-token',
      plugins: [
        inv => {
          inspectableInvocation = inv;
        }
      ]
    })((event, context) => require('./handler')(event, context))({}, {});
    await delay(100);
    const {
      report: { report: { errors: { message } } }
    } = inspectableInvocation;
    expect(message).toMatch('wow-great-type-error');
  });
});
