import _ from 'lodash';
import flatten from 'flat';
import Report from './report';
import context from 'aws-lambda-mock-context';
const schema = require('./schema.json');

const config = {
  clientId: 'foo'
};

describe('Report creation', () => {
  it('creates a new report object', () => {
    expect(
      typeof new Report({
        config,
        context: context()
      })
    ).toBe('object');
  });

  it('can take no arguments', () => {
    expect(typeof new Report()).toBe('object');
  });

  it('creates a report that matches the schema', done => {
    const r = new Report({
      metrics: [{ name: 'foo-metric', s: 'wow-string', n: 99 }]
    });
    r.send(new Error('Holy smokes!'), () => {
      const flatReport = _.chain(r.report).thru(flatten).keys().value();
      const flatSchema = _.chain(schema).thru(flatten).keys().value();
      const diff = _.difference(flatSchema, flatReport);
      const allowedMissingFields = [
        'projectId',
        'memory.rssMiB',
        'memory.totalMiB',
        'memory.rssTotalPercentage',
        'environment.python.version',
        'errors.stackHash',
        'errors.count',
        'performanceEntries.0.name',
        'performanceEntries.0.startTime',
        'performanceEntries.0.duration',
        'performanceEntries.0.entryType',
        'performanceEntries.0.timestamp'
      ];

      expect(_.isEqual(allowedMissingFields, diff)).toBe(true);
      done();
    });
  });

  it('keeps custom metrics references', () => {
    let myMetrics = [];
    const r = new Report({ config, context: context(), metrics: myMetrics });
    myMetrics.push({ n: 1, name: 'a_value' });

    expect(r.report.custom_metrics.length).toBe(1);
  });

  it('tracks plugins in use', () => {
    const mockPlugin = () => {
      return {
        config: {
          functionName: 'mockPlugin'
        }
      };
    };
    const myPlugins = [mockPlugin()];
    const r = new Report({ config, context: context(), plugins: myPlugins });

    expect(r.report.plugins.length).toBe(1);

    expect(r.report.plugins[0].name).toBe('mockPlugin');
  });
});
