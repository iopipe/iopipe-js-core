import _ from 'lodash';
import system from './mockSystem';

describe('mock system functions', () => {
  it('promisifies system data', () => {
    let stat = system.readstat();
    let status = system.readstatus();
    let bootId = system.readbootid();
    expect(Promise.resolve(stat)).toEqual(stat);
    expect(Promise.resolve(status)).toEqual(stat);
    expect(Promise.resolve(bootId)).toEqual(stat);
  });

  it('gives simple 0s for readstat', done => {
    expect.assertions(5);
    system.readstat().then(data => {
      _.chain(data)
        .pick(['utime', 'stime', 'cutime', 'cstime', 'rss'])
        .values()
        .forEach(n => expect(n).toBe(0))
        .value();
      done();
    });
  });
});
