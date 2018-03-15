import _ from 'lodash';
import mockContext from 'aws-lambda-mock-context';
import isIp from 'is-ip';

import * as dns from './dns';
import { reports } from './sendReport';
import { COLDSTART, setColdStart } from './globals';

jest.mock('./dns');
jest.mock('./sendReport');

const iopipeLib = require('./index');

function createContext(opts = {}) {
  return mockContext(
    _.defaults({}, opts, {
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

function fnGenerator(token, region, timeout, completedObj) {
  const iopipe = createAgent({
    token,
    url: `https://metrics-api.${region}.iopipe.com`
  });
  return iopipe(function Wrapper(event, ctx) {
    setTimeout(() => {
      completedObj[event.functionKey] = true;
      ctx.succeed(ctx.iopipe);
    }, timeout);
  });
}

function runWrappedFunction(fnToRun) {
  const ctx = createContext();
  const event = {};
  return new Promise(resolve => {
    // not sure why eslint thinks that userFnReturnValue is not reassigned.
    /*eslint-disable prefer-const*/
    let userFnReturnValue;
    /*eslint-enable prefer-const*/
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

function runWrappedFunctionArray(arr) {
  return Promise.all(
    arr.map(fn => {
      const ctx = mockContext();
      fn({}, ctx);
      return ctx.Promise;
    })
  );
}

test('Coldstart is true on first invocation, can be set to false', () => {
  expect(COLDSTART).toBe(true);
  setColdStart(false);
  expect(COLDSTART).toBe(false);
  setColdStart(true);
});

// this test should run first in this file due to the nature of testing the dns promises
test('DNS promise is instantiated on library import, and reused for the coldstart invocation. New DNS promises are generated for subsequent invocations', async done => {
  try {
    const { promiseInstances } = dns;
    expect(promiseInstances).toHaveLength(0);
    const iopipe = iopipeLib({ token: 'testSuite' });
    expect(promiseInstances).toHaveLength(1);

    const runs = [];

    const wrappedFunction = iopipe((event, ctx) => {
      runs.push(1);
      ctx.succeed('Decorate');
    });

    const run1 = await runWrappedFunction(wrappedFunction);
    expect(run1.response).toEqual('Decorate');
    expect(runs).toHaveLength(1);
    expect(promiseInstances).toHaveLength(1);

    const run2 = await runWrappedFunction(wrappedFunction);
    expect(run2.response).toEqual('Decorate');
    expect(runs).toHaveLength(2);
    expect(promiseInstances).toHaveLength(2);

    done();
  } catch (err) {
    throw err;
  }
});

test('Reports use different IP addresses based on config', async () => {
  const completed = {
    f1: false,
    f2: false
  };

  try {
    const wrappedFunction1 = fnGenerator(
      'ip-test-1',
      'us-west-1',
      10,
      completed
    );
    const wrappedFunction2 = fnGenerator(
      'ip-test-2',
      'us-west-2',
      5,
      completed
    );

    expect(completed.f1).toBe(false);
    expect(completed.f2).toBe(false);

    const [fn1, fn2] = await Promise.all(
      [wrappedFunction1, wrappedFunction2].map((fn, index) => {
        const ctx = mockContext();
        fn({ functionKey: `f${index + 1}` }, ctx);
        return ctx.Promise;
      })
    );
    expect(completed.f1 && completed.f2).toBe(true);
    expect(fn1.config.clientId).toBe('ip-test-1');
    expect(fn2.config.clientId).toBe('ip-test-2');
    const ips = _.chain(reports)
      .filter(r => r.client_id.match(/ip-test/))
      .map('_meta')
      .map('ipAddress')
      .value();
    expect(_.isArray(ips)).toBe(true);
    expect(ips).toHaveLength(2);
    expect(_.every(ips, isIp)).toBe(true);
    expect(ips[0]).not.toEqual(ips[1]);
  } catch (err) {
    throw err;
  }
});

test('Allows ctx.iopipe.log and iopipe.log functionality', async () => {
  expect.assertions(4);
  try {
    const iopipe = createAgent({});
    const wrappedFunction = iopipe(function Wrapper(event, ctx) {
      ctx.iopipe.log('metric-1', 'foo');
      ctx.iopipe.log('metric-2', true);
      ctx.iopipe.log('metric-3', { ding: 'dong' });
      ctx.iopipe.log('metric-4', ['whoa']);
      ctx.iopipe.log('metric-5', 100);
      ctx.iopipe.log('metric-6');
      // test deprecated iopipe.log too
      iopipe.log('metric-7', true);
      ctx.succeed('all done');
    });

    const context = mockContext({ functionName: 'log-test' });
    wrappedFunction({}, context);
    const val = await context.Promise;
    expect(val).toEqual('all done');

    const metrics = _.chain(reports)
      .find(obj => obj.aws.functionName === 'log-test')
      .get('custom_metrics')
      .value();
    expect(_.isArray(metrics)).toBe(true);
    expect(metrics).toHaveLength(7);
    expect(metrics).toMatchSnapshot();
  } catch (err) {
    throw err;
  }
});

test('ctx.iopipe.metric adds metrics to the custom_metrics array', async () => {
  expect.assertions(4);
  try {
    const iopipe = createAgent({});
    const wrappedFunction = iopipe(function Wrapper(event, ctx) {
      ctx.iopipe.metric('metric-1', 'foo');
      ctx.iopipe.metric('metric-2', true);
      ctx.iopipe.metric('metric-3', { ding: 'dong' });
      ctx.iopipe.metric('metric-4', ['whoa']);
      ctx.iopipe.metric('metric-5', 100);
      // NaN is saved as string
      ctx.iopipe.metric('metric-6', Number('foo'));
      ctx.iopipe.metric('metric-7');
      // This is too long to be added
      ctx.iopipe.metric(
        new Array(130).join('a'),
        'value not saved because key too long'
      );
      ctx.succeed('all done');
    });

    const context = mockContext({ functionName: 'metric-test' });
    wrappedFunction({}, context);
    const val = await context.Promise;
    expect(val).toEqual('all done');

    const metrics = _.chain(reports)
      .find(obj => obj.aws.functionName === 'metric-test')
      .get('custom_metrics')
      .value();
    expect(_.isArray(metrics)).toBe(true);
    expect(metrics).toHaveLength(7);
    expect(metrics).toMatchSnapshot();
  } catch (err) {
    throw err;
  }
});

test('ctx.iopipe.tag adds tags to the custom_metrics array', async () => {
  expect.assertions(4);
  try {
    const iopipe = createAgent({});
    const wrappedFunction = iopipe(function Wrapper(event, ctx) {
      ctx.iopipe.tag('tag-1');
      // Tags are stringified
      ctx.iopipe.tag(2);
      ctx.iopipe.tag({ foo: 'bar' });
      // This tag is too long to be added
      ctx.iopipe.tag(new Array(130).join('a'));
      ctx.succeed('all done');
    });

    const context = mockContext({ functionName: 'tag-test' });
    wrappedFunction({}, context);
    const val = await context.Promise;
    expect(val).toEqual('all done');

    const metrics = _.chain(reports)
      .find(obj => obj.aws.functionName === 'tag-test')
      .get('custom_metrics')
      .value();
    expect(_.isArray(metrics)).toBe(true);
    expect(metrics).toHaveLength(3);
    expect(metrics).toMatchSnapshot();
  } catch (err) {
    throw err;
  }
});

test('Does not have context.iopipe.log collisions', async () => {
  try {
    const iopipe = createAgent({
      token: 'context-iopipe-log-collisions'
    });
    const wrappedFunction1 = iopipe((event, ctx) => {
      ctx.iopipe.log('func-1-log-1', true);
      ctx.iopipe.log('func-1-log-2', true);
      ctx.iopipe.log('func-1-log-3', true);
      setTimeout(() => {
        ctx.iopipe.log('func-1-log-4', true);
        ctx.succeed('wow');
      }, 6);
    });

    const wrappedFunction2 = iopipe((event, ctx) => {
      ctx.iopipe.log('func-2-log-1', true);
      ctx.iopipe.log('func-2-log-2', true);
      setTimeout(() => {
        ctx.iopipe.log('func-2-log-3', true);
      }, 2);
      setTimeout(() => {
        ctx.succeed('neat');
      }, 20);
    });

    const [fn1, fn2, fn3] = await runWrappedFunctionArray([
      wrappedFunction1,
      wrappedFunction2,
      wrappedFunction1
    ]);
    expect(fn1).toEqual('wow');
    expect(fn2).toEqual('neat');
    expect(fn3).toEqual('wow');
    const metrics = _.chain(reports)
      .filter(r => r.client_id === 'context-iopipe-log-collisions')
      .map('custom_metrics')
      .value();
    expect(_.isArray(metrics)).toBe(true);
    expect(metrics).toHaveLength(3);
    expect(metrics).toMatchSnapshot();
  } catch (err) {
    throw err;
  }
});

test('Defining original context properties does not error if descriptors are undefined', done => {
  try {
    let doneData;

    const iopipe = createAgent({
      token: 'context-props'
    });
    const func = iopipe((event, ctx, callback) => {
      callback(null, 'woot');
    });

    func({}, { success: () => {} }, (err, data) => {
      if (err) {
        throw err;
      }
      doneData = data;
      expect(doneData).toBe('woot');
      done();
    });
  } catch (err) {
    throw err;
  }
});

class TimeoutTestPlugin {
  constructor(state) {
    this.hooks = {
      'post:invoke': () => {
        state.postInvokeCalls++;
      }
    };
    return this;
  }
}

test('When timing out, the lambda reports to iopipe, does not succeed, and reports timeout in aws', async () => {
  expect.assertions(4);
  let returnValue;
  const testState = {
    postInvokeCalls: 0
  };
  try {
    const iopipe = createAgent({
      timeoutWindow: 25,
      plugins: [() => new TimeoutTestPlugin(testState)]
    });
    const wrappedFunction = iopipe((event, ctx) => {
      setTimeout(() => {
        ctx.succeed('all done');
      }, 30);
    });

    const lambdaTimeoutMillis = 50;
    const context = mockContext({
      functionName: 'timeout-test',
      timeout: lambdaTimeoutMillis / 1000
    });
    wrappedFunction({}, context);
    returnValue = await context.Promise;
  } catch (err) {
    // the report made it to iopipe
    try {
      expect(
        _.filter(reports, obj => obj.aws.functionName === 'timeout-test')
      ).toHaveLength(1);
      // the lambda did not succeed
      expect(returnValue).toBeUndefined();
      // the lambda timed out
      expect(err.message).toMatch('Task timed out');
      expect(testState.postInvokeCalls).toBe(1);
    } catch (err2) {
      throw err2;
    }
  }
});
