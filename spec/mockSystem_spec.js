let system = require('../src/mockSystem.js');

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
    system.readstat().then(data => {
      expect(data.utime).toBe(0);
      expect(data.stime).toBe(0);
      expect(data.cutime).toBe(0);
      expect(data.cstime).toBe(0);
      expect(data.rss).toBe(0);
      done();
    });
  });
});
