import _ from 'lodash';
import delay from 'delay';

const iopipe = require('./iopipe');

describe('Catch typeError by wrapping require block', () => {
  beforeEach(() => {
    delete process.env.IOPIPE_TOKEN;
  });

  it('Has configuration', async () => {
    let inspectableInvocation;
    const result = await new Promise(resolve => {
      return iopipe({
        token: 'test-token',
        plugins: [
          inv => {
            inspectableInvocation = inv;
          }
        ]
      })((event, context) => require('./handler')(event, context))(
        {},
        {},
        resolve
      );
    });
    await delay(100);
    expect(_.isError(result)).toBe(true);
    expect(result.message).toMatch('wow-great-type-error');
    const {
      report: { report: { errors: { message } } }
    } = inspectableInvocation;
    expect(message).toMatch('wow-great-type-error');
  });
});
