import IOpipe from '../dist/iopipe.js';
import mockContext from 'aws-lambda-mock-context';
// default region for testing
process.env.AWS_REGION = 'us-east-1';

function runWrappedFunction(
  ctx = mockContext(),
  event = {},
  iopipe = IOpipe({ token: 'testSuite' }),
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

  it('allows .decorate API', () => {
    const iopipe = IOpipe({ token: 'testSuite' });
    const wrappedFunction = iopipe.decorate((event, ctx) => {
      ctx.succeed('Decorate');
    });

    runWrappedFunction(
      undefined,
      undefined,
      undefined,
      wrappedFunction
    ).then(obj => {
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
