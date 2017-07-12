import _ from 'lodash';
import flatten from 'flat';
import Report from './report';
import context from 'aws-lambda-mock-context';
import { PAYLOAD_SCHEMA as schema } from 'iopipe-payload';

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

  it('creates a report that matches the schema', done => {
    const r = new Report(undefined, undefined, undefined, [
      { name: 'foo-metric', s: 'wow-string', n: 99 }
    ]);
    r.send(new Error('Holy smokes!'), () => {
      const flatReport = _.chain(r.report).thru(flatten).keys().value();
      const flatSchema = _.chain(schema).thru(flatten).keys().value();
      const diff = _.difference(flatSchema, flatReport);
      const allowedMissingFields = [
        'memory.rssMiB',
        'memory.totalMiB',
        'memory.rssTotalPercentage',
        'environment.python.version',
        'errors.stackHash',
        'errors.count'
      ];
      expect(_.isEqual(allowedMissingFields, diff)).toBe(true);
      done();
    });
  });

  it('keeps custom metrics references', () => {
    let myMetrics = [];
    const r = new Report(config, context(), process.hrtime(), myMetrics);
    myMetrics.push({ n: 1, name: 'a_value' });

    expect(r.report.custom_metrics.length).toBe(1);
  });
});
