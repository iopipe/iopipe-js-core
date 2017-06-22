const IOpipe = require('../index.js');
const mockContext = require('aws-lambda-mock-context');
// default region for testing
process.env.AWS_REGION = 'us-east-1';

function runWrappedFunction(contextArg, eventArg, iopipeArg, functionArg) {
  const ctx = contextArg || mockContext();
  const iopipe = iopipeArg || IOpipe({ token: 'testSuite' });
  const event = eventArg || {};
  const defaultFn = (fnEvent, context) => {
    context.succeed('Success');
  };
  const fnToRun = functionArg || iopipe(defaultFn);
  return new Promise(resolve => {
    function fnResolver(error, response) {
      return resolve({
        ctx: ctx,
        response: response,
        iopipe: iopipe,
        error: error
      });
    }
    fnToRun(event, ctx, fnResolver);
    ctx.Promise.then(success => fnResolver(null, success)).catch(fnResolver);
  });
}

function sendToRegionTest(regionArg, done) {
  const region = regionArg || 'us-east-1';
  process.env.AWS_REGION = region;
  runWrappedFunction(
    mockContext({ region: region }),
    null,
    IOpipe({ clientId: 'testSuite' })
  ).then(obj => {
    expect(obj.response).toEqual('Success');
    expect(obj.error).toEqual(null);
    done();
  });
}

describe('metrics agent', () => {
  it('should return a function', () => {
    let agent = IOpipe();
    expect(typeof agent).toEqual('function');
  });

  it('should successfully getRemainingTimeInMillis from aws context', () => {
    runWrappedFunction().then(obj => {
      expect(typeof obj.ctx.getRemainingTimeInMillis).toBe('function');
    });
  });

  it('allows .decorate API', () => {
    let iopipe = IOpipe({ token: 'testSuite' });
    let wrappedFunction = iopipe.decorate((event, ctx) => {
      ctx.succeed('Decorate');
    });

    runWrappedFunction(null, null, null, wrappedFunction).then(obj => {
      expect(obj.response).toEqual('Decorate');
    });
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
    runWrappedFunction(null, null, null, fn).then(obj => {
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
      runWrappedFunction(null, null, null, fn).then(obj => {
        expect(obj.response).toEqual('Success!');
        done();
      });
    });
  });

  describe('sends to specified regions', () => {
    it('sends to ap-southeast-2', done => {
      sendToRegionTest('ap-southeast-2', done);
    });

    it('sends to eu-west-1', done => {
      sendToRegionTest('eu-west-1', done);
    });

    it('sends to us-east-1/our default URL', done => {
      sendToRegionTest('us-east-1', done);
    });

    it('sends to us-east-2', done => {
      sendToRegionTest('us-east-2', done);
    });

    it('sends to us-west-1', done => {
      sendToRegionTest('us-west-1', done);
    });

    it('sends to us-west-2', done => {
      sendToRegionTest('us-west-2', done);
    });

    it('sends to custom URLs (staging)', done => {
      runWrappedFunction(
        null,
        null,
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
