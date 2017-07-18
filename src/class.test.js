import _ from 'lodash';
import IOpipe from './index';
import mockContext from 'aws-lambda-mock-context';

jest.mock('./dns');
import * as dns from './dns';

function defaultCatch(err) {
  console.error(err);
  throw err;
}

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

it('DNS promise is instantiated on library import, and reused for the coldstart invocation. New DNS promises are generated for subsequent invocations', done => {
  const { promiseInstances } = dns;
  expect(promiseInstances.length).toBe(0);
  const iopipe = IOpipe({ token: 'wow' });
  expect(promiseInstances.length).toBe(1);

  const wrappedFunction = iopipe((event, ctx) => {
    ctx.succeed('Decorate');
  });

  runWrappedFunction(wrappedFunction)
    .then(obj => {
      expect(obj.response).toEqual('Decorate');
      expect(promiseInstances.length).toBe(1);
    })
    .catch(defaultCatch);

  setTimeout(() => {
    runWrappedFunction(wrappedFunction)
      .then(obj => {
        expect(obj.response).toEqual('Decorate');
        expect(promiseInstances.length).toBe(2);
        done();
      })
      .catch(defaultCatch);
  }, 300);
});
