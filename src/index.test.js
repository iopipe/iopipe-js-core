import _ from 'lodash';
import IOpipe from '../dist/iopipe.js';
import mockContext from 'aws-lambda-mock-context';
import isIp from 'is-ip';
// default region for testing
process.env.AWS_REGION = 'us-east-1';

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

function createAgent(kwargs) {
  return IOpipe(
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
    let userFnReturnValue = undefined;
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
  runWrappedFunction(
    createContext({ region }),
    undefined,
    createAgent()
  ).then(obj => {
    expect(obj.response).toEqual('Success');
    expect(obj.error).toEqual(null);
    done();
  });
}

describe('metrics agent', () => {
  it('should return a function', () => {
    const agent = createAgent();
    expect(typeof agent).toEqual('function');
  });

  it('should successfully getRemainingTimeInMillis from aws context', () => {
    runWrappedFunction().then(obj => {
      expect(typeof obj.ctx.getRemainingTimeInMillis).toBe('function');
    });
  });

  it('runs the user function and returns the original value', done => {
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

  it('allows per-setup configuration', done => {
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
        const wrapperInstance = this;
        setTimeout(() => {
          completed[token] = true;
          ctx.succeed({
            config: ctx.iopipe.config,
            dnsPromise: wrapperInstance.dnsPromise
          });
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
        Promise.all([fn1.response.dnsPromise, fn2.response.dnsPromise])
          .then(proms => {
            const [dns1, dns2] = proms;
            expect(completed.f1 && completed.f2).toBe(true);
            expect(fn1.response.config.clientId).toBe('f1');
            expect(fn2.response.config.clientId).toBe('f2');
            expect(_.every([_.isString(dns1), _.isString(dns2)])).toBe(true);
            expect(isIp(dns1)).toBe(true);
            expect(isIp(dns2)).toBe(true);
            expect(dns1).not.toEqual(dns2);
            done();
          })
          .catch(defaultCatch);
      })
      .catch(defaultCatch);
  });

  it('allows .decorate API', done => {
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

  it('Returns a value from context.succeed', done => {
    const iopipe = createAgent({ debug: true });
    const wrappedFunction = iopipe((event, ctx) => {
      ctx.succeed('my-val');
    });

    let val = undefined;

    wrappedFunction(
      {},
      {
        succeed: function funtimes(data) {
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

  it('Returns a value from callback', done => {
    const iopipe = createAgent({ debug: true });
    const wrappedFunction = iopipe((event, ctx, cb) => {
      cb(null, 'my-val');
    });

    let val = undefined;

    wrappedFunction(
      {},
      {
        succeed: _.noop,
        fail: _.noop,
        done: _.noop
      },
      (err, data) => {
        val = data;
      }
    );
    setTimeout(() => {
      expect(val).toEqual('my-val');
      done();
      // 1000 is a magic number until the collector uses a mock for testing
    }, 1000);
  });

  it('has a proper context object', done => {
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

  it('allows .log functionality', done => {
    expect.assertions(13);
    const iopipe = createAgent();
    const wrappedFunction = iopipe.decorate(function Wrapper(event, ctx) {
      ctx.iopipe.log('metric-1', 'foo');
      ctx.iopipe.log('metric-2', true);
      ctx.iopipe.log('metric-3', { ding: 'dong' });
      ctx.iopipe.log('metric-4', ['whoa']);
      ctx.iopipe.log('metric-5', 100);
      ctx.iopipe.log('metric-6');
      // test deprecated iopipe.log too
      iopipe.log('metric-7', true);
      ctx.succeed(this.metrics);
    });

    runWrappedFunction(undefined, undefined, undefined, wrappedFunction)
      .then(obj => {
        expect(_.isArray(obj.response)).toEqual(true);
        expect(obj.response.length).toEqual(7);
        const [m1, m2, m3, m4, m5, m6, m7] = obj.response;
        expect(m1).toBeInstanceOf(Object);
        expect(m1.name).toEqual('metric-1');
        expect(m1.n).toEqual(undefined);
        expect(m1.s).toEqual('foo');
        expect(m2.s).toEqual('true');
        expect(m3.s).toEqual('{"ding":"dong"}');
        expect(m4.s).toEqual('["whoa"]');
        expect(m5.n).toEqual(100);
        expect(m6.name).toEqual('metric-6');
        expect(m6.n).toEqual(undefined);
        expect(m7.s).toEqual('true');
        done();
      })
      .catch(defaultCatch);
  });

  it('does not have context.iopipe.log collisions, unless using iopipe.log', done => {
    expect.assertions(6);
    let f1Complete = false;
    let f2Complete = false;

    const iopipe = createAgent();
    const wrappedFunction1 = iopipe.decorate(function Wrapper(event, ctx) {
      const self = this;
      ctx.iopipe.log('func-1-log-1', true);
      iopipe.log('iopipe-log-func-1-log-2', true);
      ctx.iopipe.log('func-1-log-3', true);
      setTimeout(() => {
        iopipe.log('iopipe-log-func-1-log-4', true);
        f1Complete = true;
        ctx.succeed(self.metrics);
      }, 5);
    });

    const wrappedFunction2 = iopipe.decorate(function Wrapper(event, ctx) {
      const self = this;
      ctx.iopipe.log('func-2-log-1', true);
      ctx.iopipe.log('func-2-log-2', true);
      setTimeout(() => {
        iopipe.log('iopipe-log-func-2-log-3', true);
      }, 2);
      setTimeout(() => {
        f2Complete = true;
        ctx.succeed(self.metrics);
      }, 10);
    });

    expect(f1Complete).toBe(false);
    expect(f2Complete).toBe(false);

    Promise.all(
      [wrappedFunction1, wrappedFunction2, wrappedFunction1].map(fn =>
        runWrappedFunction(undefined, undefined, undefined, fn)
      )
    )
      .then(values => {
        const [fn1, fn2, fn3] = values;
        expect(f1Complete && f2Complete).toBe(true);
        expect(fn1.response).toMatchSnapshot();
        expect(fn2.response).toMatchSnapshot();
        expect(fn3.response).toMatchSnapshot();
        done();
      })
      .catch(defaultCatch);
  });
});

describe('smoke test', () => {
  it('will run when installed on a successful function', done => {
    runWrappedFunction().then(obj => {
      expect(obj.response).toBeTruthy();
      done();
    });
  });

  it('will run when installed on a failing function', done => {
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
    it('will run when installed on a successful function using callbacks', done => {
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
    [
      'ap-southeast-2',
      'eu-west-1',
      'us-east-1',
      'us-east-2',
      'us-west-1',
      'us-west-2'
    ].forEach(region => {
      it(`sends to ${region}`, done => {
        sendToRegionTest(region, done);
      });
    });

    it('sends to custom URLs (staging)', done => {
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
