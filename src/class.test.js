import _ from 'lodash';
import mockContext from 'aws-lambda-mock-context';
import isIp from 'is-ip';

import * as dns from './dns';
import { reports } from './sendReport';
import { COLDSTART, setColdStart } from './globals';
import { get as getContext } from './invocationContext';

jest.mock('./dns');
jest.mock('./sendReport');

const iopipeLib = require('./index');

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

function runWrappedFunction(fnToRun, funcName) {
  const functionName = funcName || 'iopipe-lib-unit-tests';
  const ctx = mockContext({ functionName });
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

test('Coldstart is true on first invocation, can be set to false', () => {
  expect(COLDSTART).toBe(true);
  setColdStart(false);
  expect(COLDSTART).toBe(false);
  setColdStart(true);
});

// this test should run first in this file due to the nature of testing the dns promises
test('coldstarts use dns and label appropriately', async done => {
  // 'DNS promise is instantiated on library import, and reused for the coldstart invocation. New DNS promises are generated for subsequent invocations
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

    const run1 = await runWrappedFunction(wrappedFunction, 'coldstart-test');
    const coldstartTest = _.find(
      reports,
      obj => obj.aws.functionName === 'coldstart-test'
    );
    expect(coldstartTest.coldstart).toBe(true);
    expect(coldstartTest.labels).toContain('@iopipe/coldstart');
    expect(run1.response).toEqual('Decorate');
    expect(runs).toHaveLength(1);
    expect(promiseInstances).toHaveLength(1);

    const run2 = await runWrappedFunction(wrappedFunction, 'coldstart-test2');
    const coldstartTest2 = _.find(
      reports,
      obj => obj.aws.functionName === 'coldstart-test2'
    );
    expect(coldstartTest2.coldstart).toBe(false);
    expect(coldstartTest2.labels).not.toContain('@iopipe/coldstart');
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
  expect.assertions(5);
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

    // Check for autolabel because metrics were added
    const labels = _.chain(reports)
      .find(obj => obj.aws.functionName === 'metric-test')
      .get('labels')
      .value();
    expect(labels.includes('@iopipe/metrics')).toBe(true);
  } catch (err) {
    throw err;
  }
});

test('Autolabels do not cause the @iopipe/metrics label to be added', async () => {
  expect.assertions(3);
  try {
    const iopipe = createAgent({});
    const wrappedFunction = iopipe(function Wrapper(event, ctx) {
      ctx.iopipe.metric('@iopipe/foo', 'some-value');
      ctx.succeed('all done');
    });

    const context = mockContext({ functionName: 'auto-label-test' });
    wrappedFunction({}, context);
    const val = await context.Promise;
    expect(val).toEqual('all done');

    const labels = _.chain(reports)
      .find(obj => obj.aws.functionName === 'auto-label-test')
      .get('labels')
      .value();

    expect(_.isArray(labels)).toBe(true);
    expect(labels).toHaveLength(0);
  } catch (err) {
    throw err;
  }
});

test('ctx.iopipe.label adds labels to the labels array', async () => {
  expect.assertions(4);
  try {
    const iopipe = createAgent({});
    const wrappedFunction = iopipe(function Wrapper(event, ctx) {
      ctx.iopipe.label('label-1');
      ctx.iopipe.label('label-2');
      // Non-strings are dropped
      ctx.iopipe.label(2);
      ctx.iopipe.label({ foo: 'bar' });
      // This label is too long to be added
      ctx.iopipe.label(new Array(130).join('a'));
      ctx.succeed('all done');
    });

    const context = mockContext({ functionName: 'label-test' });
    wrappedFunction({}, context);
    const val = await context.Promise;
    expect(val).toEqual('all done');

    const labels = _.chain(reports)
      .find(obj => obj.aws.functionName === 'label-test')
      .get('labels')
      .value();

    expect(_.isArray(labels)).toBe(true);
    expect(labels).toHaveLength(2);
    expect(labels).toMatchSnapshot();
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
      const report = _.find(
        reports,
        obj => obj.aws.functionName === 'timeout-test'
      );
      expect(report.labels).toContain('@iopipe/timeout');
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

test('Exposes getContext function which is undefined before + after invocation, populated with current context during invocation', async () => {
  try {
    expect(getContext()).toBeUndefined();
    expect(_.isFunction(iopipeLib.getContext)).toBe(true);
    expect(iopipeLib.getContext()).toBeUndefined();
    const iopipe = createAgent({ token: 'getContext' });
    const wrappedFunction = iopipe(function Wrapper(event, ctx) {
      ctx.succeed(200);
      expect(getContext().functionName).toBe('getContext');
      iopipeLib.getContext().iopipe.log('getContextMetric');
    });

    const context = mockContext({ functionName: 'getContext' });
    wrappedFunction({}, context);
    expect(iopipeLib.getContext().functionName).toEqual('getContext');
    const val = await context.Promise;
    expect(getContext()).toBeUndefined();
    expect(iopipeLib.getContext()).toBeUndefined();
    expect(val).toEqual(200);
    const metrics = _.chain(reports)
      .filter(r => r.client_id === 'getContext')
      .map('custom_metrics')
      .value();
    expect(metrics).toEqual([[{ name: 'getContextMetric', s: 'undefined' }]]);
  } catch (err) {
    throw err;
  }
});

test('Captures errors that are not instanceof Error', async () => {
  try {
    const iopipe = createAgent({ token: 'objectErrorHandling' });
    const wrappedFunction = iopipe(function Wrapper(event, ctx) {
      ctx.fail({ foo: true });
    });

    const context = mockContext({ functionName: 'objectErrorHandling' });
    wrappedFunction({}, context);
    try {
      await context.Promise;
      throw new Error('Test should fail by reaching this point');
    } catch (err) {
      const report = _.find(
        reports,
        r => r.client_id === 'objectErrorHandling'
      );
      const { name, message, stack } = report.errors;
      // all values should be truthy strings
      expect([name, message, stack].map(d => typeof d)).toEqual(
        _.fill(Array(3), 'string')
      );
      expect(report.labels).toContain('@iopipe/error');
    }
  } catch (err) {
    throw err;
  }
});
