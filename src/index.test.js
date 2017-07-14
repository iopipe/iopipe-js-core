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

function runWrappedFunction(
  ctx = mockContext(),
  event = {},
  iopipe = IOpipe({ token: 'testSuite!' }),
  functionArg
) {
  const defaultFn = (fnEvent, context) => {
    context.succeed('Success');
  };
  const fnToRun = functionArg || iopipe(defaultFn);
  return new Promise(resolve => {
    function fnResolver(error, response) {
      return resolve({
        ctx,
        response,
        iopipe,
        error
      });
    }
    fnToRun(event, ctx, fnResolver);
    ctx.Promise.then(success => fnResolver(null, success)).catch(fnResolver);
  });
}

function sendToRegionTest(region = 'us-east-1', done) {
  process.env.AWS_REGION = region;
  runWrappedFunction(
    mockContext({ region: region }),
    undefined,
    IOpipe({ clientId: 'testSuite' })
  ).then(obj => {
    expect(obj.response).toEqual('Success');
    expect(obj.error).toEqual(null);
    done();
  });
}

describe('metrics agent', () => {
  it('should return a function', () => {
    const agent = IOpipe();
    expect(typeof agent).toEqual('function');
  });

  it('should successfully getRemainingTimeInMillis from aws context', () => {
    runWrappedFunction().then(obj => {
      expect(typeof obj.ctx.getRemainingTimeInMillis).toBe('function');
    });
  });

  it('allows per-setup configuration', done => {
    // expect.assertions(5);
    let f1Complete = false;
    let f2Complete = false;

    const iopipe = IOpipe({
      token: 'number-1',
      url: 'https://metrics-api.us-west-1.iopipe.com'
    });
    const wrappedFunction1 = iopipe(function foo(event, ctx) {
      setTimeout(() => {
        f1Complete = true;
        ctx.succeed(ctx.iopipe);
      }, 10);
    });

    const iopipe2 = IOpipe({
      token: 'number-2',
      url: 'https://metrics-api.us-west-2.iopipe.com'
    });
    const wrappedFunction2 = iopipe2(function foo(event, ctx) {
      setTimeout(() => {
        f2Complete = true;
        ctx.succeed(ctx.iopipe);
      }, 5);
    });

    expect(f1Complete).toBe(false);
    expect(f2Complete).toBe(false);

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
            expect(f1Complete && f2Complete).toBe(true);
            expect(fn1.response.config.clientId).toBe('number-1');
            expect(fn2.response.config.clientId).toBe('number-2');
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
    const iopipe = IOpipe({ token: 'testSuite' });
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

  it('has a proper context object', done => {
    expect.assertions(7);
    const iopipe = IOpipe({ token: 'testSuite' });
    const wrappedFunction = iopipe.decorate((event, ctx) => {
      // use json, otherwise it seems circular refs are doing bad things
      ctx.callbackWaitsForEmptyEventLoop = true;
      ctx.succeed(JSON.stringify(ctx));
    });

    const testContext = mockContext();
    expect(testContext.callbackWaitsForEmptyEventLoop).toBe(true);
    testContext.callbackWaitsForEmptyEventLoop = false;
    expect(testContext.callbackWaitsForEmptyEventLoop).toBe(false);

    runWrappedFunction(testContext, undefined, undefined, wrappedFunction)
      .then(obj => {
        const ctx = JSON.parse(obj.response);
        expect(_.isObject(ctx)).toBeTruthy();
        expect(_.isArray(ctx.iopipe.metrics)).toBeTruthy();
        expect(ctx.memoryLimitInMB).toBe('128');
        expect(ctx.callbackWaitsForEmptyEventLoop).toBe(true);
        expect(testContext.callbackWaitsForEmptyEventLoop).toBe(true);
        done();
      })
      .catch(defaultCatch);
  });

  it('allows .log functionality', done => {
    expect.assertions(11);
    const iopipe = IOpipe({ token: 'testSuite' });
    const wrappedFunction = iopipe.decorate((event, ctx) => {
      ctx.iopipe.log('metric-1', 'foo');
      ctx.iopipe.log('metric-2', true);
      ctx.iopipe.log('metric-3', { ding: 'dong' });
      ctx.iopipe.log('metric-4', ['whoa']);
      ctx.iopipe.log('metric-5', 100);
      ctx.iopipe.log('metric-6');
      ctx.succeed(ctx.iopipe.metrics);
    });

    runWrappedFunction(undefined, undefined, undefined, wrappedFunction)
      .then(obj => {
        expect(_.isArray(obj.response)).toEqual(true);
        expect(obj.response.length).toEqual(6);
        const [m1, m2, m3, m4, m5, m6] = obj.response;
        expect(m1).toBeInstanceOf(Object);
        expect(m1.name).toEqual('metric-1');
        expect(m1.n).toEqual(undefined);
        expect(m1.s).toEqual('foo');
        expect(m2.s).toEqual('true');
        expect(m3.s).toEqual('{"ding":"dong"}');
        expect(m4.s).toEqual('["whoa"]');
        expect(m5.n).toEqual(100);
        expect(m6.n).toEqual(1);
        done();
      })
      .catch(defaultCatch);
  });

  it('does not have metric (.log) collisions', done => {
    expect.assertions(9);
    let f1Complete = false;
    let f2Complete = false;

    const iopipe = IOpipe({ token: 'testSuite' });
    const wrappedFunction1 = iopipe.decorate((event, ctx) => {
      ctx.iopipe.log('func-1', true);
      setTimeout(() => {
        f1Complete = true;
        ctx.succeed(ctx.iopipe.metrics);
      }, 5);
    });

    const wrappedFunction2 = iopipe.decorate((event, ctx) => {
      ctx.iopipe.log('func-2', true);
      setTimeout(() => {
        f2Complete = true;
        ctx.succeed(ctx.iopipe.metrics);
      }, 10);
    });

    expect(f1Complete).toBe(false);
    expect(f2Complete).toBe(false);

    Promise.all(
      [wrappedFunction1, wrappedFunction2].map(fn =>
        runWrappedFunction(undefined, undefined, undefined, fn)
      )
    )
      .then(values => {
        const [fn1, fn2] = values;
        expect(f1Complete && f2Complete).toBe(true);
        expect(_.isArray(fn1.response)).toBe(true);
        expect(_.isArray(fn2.response)).toBe(true);
        expect(fn1.response.length).toBe(1);
        expect(fn2.response.length).toBe(1);
        expect(fn1.response[0].name).toEqual('func-1');
        expect(fn2.response[0].name).toEqual('func-2');
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
        IOpipe({
          clientId: 'testSuite',
          url: 'https://metrics-api-staging.iopipe.com'
        })
      ).then(obj => {
        expect(obj.response).toEqual('Success');
        done();
      });
    });
  });
});
