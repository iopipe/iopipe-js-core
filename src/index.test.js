import _ from 'lodash';
import mockContext from 'aws-lambda-mock-context';

import { resetEnv } from '../util/testUtils';
import { SUPPORTED_REGIONS } from './constants';

const iopipeLib = require('../dist/iopipe.js');

function defaultCatch(err) {
  /*eslint-disable no-console*/
  console.error(err);
  /*eslint-enable no-console*/
  throw err;
}

function createContext(opts = {}) {
  return mockContext(
    Object.assign(opts, {
      functionName: 'iopipe-lib-unit-tests'
    })
  );
}

function createAgent(kwargs) {
  return iopipeLib(
    _.defaults(kwargs, {
      token: 'testSuite'
    })
  );
}

function runWrappedFunction(
  ctx = createContext(),
  event = {},
  iopipe = createAgent(),
  functionArg
) {
  const defaultFn = (fnEvent, context) => {
    context.succeed('Success');
  };
  const fnToRun = functionArg || iopipe(defaultFn);
  return new Promise(resolve => {
    // not sure why eslint thinks that userFnReturnValue is not reassigned.
    /*eslint-disable prefer-const*/
    let userFnReturnValue;
    /*eslint-enable prefer-const*/
    function fnResolver(error, response) {
      return resolve({
        ctx,
        response,
        iopipe,
        error,
        userFnReturnValue
      });
    }
    userFnReturnValue = fnToRun(event, ctx, fnResolver);
    ctx.Promise.then(success => fnResolver(null, success)).catch(fnResolver);
  });
}

function sendToRegionTest(region = 'us-east-1', done) {
  process.env.AWS_REGION = region;
  runWrappedFunction(createContext({ region }), undefined, createAgent()).then(
    obj => {
      expect(obj.response).toEqual('Success');
      expect(obj.error).toBeNull();
      done();
    }
  );
}

beforeEach(() => {
  resetEnv();
});

describe('metrics agent', () => {
  test('should return a function', () => {
    const agent = createAgent();
    expect(typeof agent).toEqual('function');
  });

  test('should successfully getRemainingTimeInMillis from aws context', () => {
    runWrappedFunction().then(obj => {
      expect(typeof obj.ctx.getRemainingTimeInMillis).toBe('function');
    });
  });

  test('runs the user function and returns the original value', done => {
    const iopipe = createAgent();
    const wrappedFunction = iopipe((event, ctx) => {
      ctx.succeed('Decorate');
      return 'wow';
    });

    runWrappedFunction(undefined, undefined, undefined, wrappedFunction)
      .then(obj => {
        expect(obj.userFnReturnValue).toEqual('wow');
        done();
      })
      .catch(defaultCatch);
  });

  test('allows per-setup configuration', done => {
    const completed = {
      f1: false,
      f2: false
    };

    function fnGenerator(token, region, timeout) {
      const iopipe = createAgent({
        token,
        url: `https://metrics-api.${region}.iopipe.com`
      });
      return iopipe(function Wrapper(event, ctx) {
        setTimeout(() => {
          completed[token] = true;
          ctx.succeed(ctx.iopipe);
        }, timeout);
      });
    }

    const wrappedFunction1 = fnGenerator('f1', 'us-west-1', 10);
    const wrappedFunction2 = fnGenerator('f2', 'us-west-2', 5);

    expect(completed.f1).toBe(false);
    expect(completed.f2).toBe(false);

    Promise.all(
      [wrappedFunction1, wrappedFunction2].map(fn =>
        runWrappedFunction(undefined, undefined, undefined, fn)
      )
    )
      .then(values => {
        const [fn1, fn2] = values;
        expect(completed.f1 && completed.f2).toBe(true);
        expect(fn1.response.config.clientId).toBe('f1');
        expect(fn2.response.config.clientId).toBe('f2');
        done();
      })
      .catch(defaultCatch);
  });

  test('allows .decorate API', done => {
    const iopipe = createAgent();
    const wrappedFunction = iopipe.decorate((event, ctx) => {
      ctx.succeed('Decorate');
    });

    runWrappedFunction(undefined, undefined, undefined, wrappedFunction)
      .then(obj => {
        expect(obj.response).toEqual('Decorate');
        done();
      })
      .catch(defaultCatch);
  });

  test('Returns a value from context.succeed', done => {
    const iopipe = createAgent({ debug: true });
    const wrappedFunction = iopipe((event, ctx) => {
      ctx.succeed('my-val');
    });

    let val;

    wrappedFunction(
      {},
      {
        succeed: data => {
          val = data;
        },
        fail: _.noop,
        done: _.noop
      },
      _.noop
    );
    setTimeout(() => {
      expect(val).toEqual('my-val');
      done();
      // 1000 is a magic number until the collector uses a mock for testing
    }, 1000);
  });

  test('Returns a value from callback', done => {
    const iopipe = createAgent({ debug: true });
    const wrappedFunction = iopipe((event, ctx, cb) => {
      cb(null, 'my-val');
    });

    let val;

    wrappedFunction(
      {},
      {
        succeed: _.noop,
        fail: _.noop,
        done: _.noop
      },
      (err, data) => {
        if (err) {
          throw err;
        }
        val = data;
      }
    );
    setTimeout(() => {
      expect(val).toEqual('my-val');
      done();
      // 1000 is a magic number until the collector uses a mock for testing
    }, 1000);
  });

  test('has a proper context object', done => {
    expect.assertions(6);
    const iopipe = createAgent();
    const wrappedFunction = iopipe.decorate((event, ctx) => {
      // use json, otherwise it seems circular refs are doing bad things
      ctx.callbackWaitsForEmptyEventLoop = true;
      ctx.succeed(JSON.stringify(ctx));
    });

    const testContext = createContext();
    expect(testContext.callbackWaitsForEmptyEventLoop).toBe(true);
    testContext.callbackWaitsForEmptyEventLoop = false;
    expect(testContext.callbackWaitsForEmptyEventLoop).toBe(false);

    runWrappedFunction(testContext, undefined, undefined, wrappedFunction)
      .then(obj => {
        const ctx = JSON.parse(obj.response);
        expect(_.isObject(ctx)).toBeTruthy();
        expect(ctx.memoryLimitInMB).toBe('128');
        expect(ctx.callbackWaitsForEmptyEventLoop).toBe(true);
        expect(testContext.callbackWaitsForEmptyEventLoop).toBe(true);
        done();
      })
      .catch(defaultCatch);
  });

  test('will return unwrapped function if token unset', () => {
    const fn = (event, context) => {
      context.succeed('Success');
    };

    const agent = createAgent({ token: '' });

    expect(agent(fn)).toBe(fn);
  });

  test('will return unwrapped function if agent disabled', () => {
    const fn = (event, context) => {
      context.succeed('Success');
    };

    const agent = createAgent({ enabled: false });

    expect(agent(fn)).toBe(fn);
  });
});

describe('smoke test', () => {
  test('will run when installed on a successful function', done => {
    runWrappedFunction().then(obj => {
      expect(obj.response).toBeTruthy();
      done();
    });
  });

  test('will run when installed on a failing function', done => {
    const fn = (event, context) => {
      context.fail('Whoops!');
    };
    runWrappedFunction(undefined, undefined, undefined, fn).then(obj => {
      expect(obj.error instanceof Error).toEqual(true);
      expect(obj.error.message).toEqual('Whoops!');
      expect(obj.response).toBeUndefined();
      done();
    });
  });

  describe('functions using callbacks', () => {
    test('will run when installed on a successful function using callbacks', done => {
      const fn = (event, ctx, cb) => {
        cb(null, 'Success!');
      };
      runWrappedFunction(undefined, undefined, undefined, fn).then(obj => {
        expect(obj.response).toEqual('Success!');
        done();
      });
    });
  });

  describe('sends to specified regions', () => {
    for (const region of SUPPORTED_REGIONS.keys()) {
      test(`sends to ${region}`, done => {
        sendToRegionTest(region, done);
      });
    }

    test('sends to custom URLs (staging)', done => {
      runWrappedFunction(
        undefined,
        undefined,
        createAgent({
          url: 'https://metrics-api-staging.iopipe.com'
        })
      ).then(obj => {
        expect(obj.response).toEqual('Success');
        done();
      });
    });
  });
});
