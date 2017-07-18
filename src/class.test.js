import _ from 'lodash';
import IOpipe from './index';
import mockContext from 'aws-lambda-mock-context';

jest.mock('./dns');
import * as dns from './dns';

function createContext(opts = {}) {
  return mockContext(
    Object.assign(opts, {
      functionName: 'iopipe-lib-unit-tests'
    })
  );
}

function runWrappedFunction(fnToRun) {
  const ctx = createContext();
  const event = {};
  return new Promise(resolve => {
    let userFnReturnValue = undefined;
    function fnResolver(error, response) {
      return resolve({
        ctx,
        response,
        error,
        userFnReturnValue
      });
    }
    userFnReturnValue = fnToRun(event, ctx, fnResolver);
    ctx.Promise.then(success => fnResolver(null, success)).catch(fnResolver);
  });
}

test('DNS promise is instantiated on library import, and reused for the coldstart invocation. New DNS promises are generated for subsequent invocations', async done => {
  try {
    const { promiseInstances } = dns;
    expect(promiseInstances.length).toBe(0);
    const iopipe = IOpipe({ token: 'testSuite' });
    expect(promiseInstances.length).toBe(1);

    const runs = [];

    const wrappedFunction = iopipe((event, ctx) => {
      runs.push(1);
      ctx.succeed('Decorate');
    });

    const run1 = await runWrappedFunction(wrappedFunction);
    expect(run1.response).toEqual('Decorate');
    expect(runs.length).toEqual(1);
    expect(promiseInstances.length).toBe(1);

    const run2 = await runWrappedFunction(wrappedFunction);
    expect(run2.response).toEqual('Decorate');
    expect(runs.length).toEqual(2);
    expect(promiseInstances.length).toBe(2);

    done();
  } catch (err) {
    console.error(err);
    throw err;
  }
});
