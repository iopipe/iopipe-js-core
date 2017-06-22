const Report = require('../src/report');
const context = require('aws-lambda-mock-context');
const schema = require('iopipe-payload').PAYLOAD_SCHEMA;
// arguments
const config = {
  clientId: 'foo'
};

describe('Report creation', () => {
  it('creates a new report object', () => {
    expect(typeof new Report(config, context(), process.hrtime(), [])).toBe(
      'object'
    );
  });

  it('can take no arguments', () => {
    expect(typeof new Report()).toBe('object');
  });

  it('creates a report that matches the schema', () => {
    const r = new Report();
    function iterateKeys(object) {
      Object.keys(object).forEach(key => {
        // custom metrics array
        if (Array.isArray(schema[key])) {
          expect(Array.isArray(r.report[key])).toBeTruthy();
        } else if (typeof schema[key] == 'object') {
          return iterateKeys(schema[key], true);
        }
        return expect(key in r.report).toBeTruthy();
      });
    }

    iterateKeys(schema);
  });

  it('keeps custom metrics references', () => {
    let myMetrics = [];
    const r = new Report(config, context(), process.hrtime(), myMetrics);
    myMetrics.push({ n: 1, name: 'a_value' });

    expect(r.report.custom_metrics.length).toBe(1);
  });
});
