import _ from 'lodash';
import { readstat, readstatus, readbootid } from './mockSystem';

describe('mock system functions', () => {
  test('promisifies system data', () => {
    const stat = readstat();
    const status = readstatus();
    const bootId = readbootid();
    expect(Promise.resolve(stat)).toEqual(stat);
    expect(Promise.resolve(status)).toEqual(stat);
    expect(Promise.resolve(bootId)).toEqual(stat);
  });

  test('gives simple 0s for readstat', done => {
    expect.assertions(5);
    readstat().then(data => {
      const { utime, stime, cutime, cstime, rss } = data;
      expect(utime).toBe(0);
      expect(stime).toBe(0);
      expect(cutime).toBe(0);
      expect(cstime).toBe(0);
      expect(rss).toBe(0);
      done();
    });
  });
});
