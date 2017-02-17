var system = require('../src/mockSystem.js')

describe('mock system functions', function() {
  it('promisifies system data', function() {
    var stat = system.readstat()
    var status = system.readstatus()
    var bootId = system.readbootid()
    expect(Promise.resolve(stat)).toEqual(stat)
    expect(Promise.resolve(status)).toEqual(stat)
    expect(Promise.resolve(bootId)).toEqual(stat)
  })

  it('gives simple 0s for readstat', function(done) {
    system.readstat().then(function(data) {
      expect(data.utime).toBe(0)
      expect(data.stime).toBe(0)
      expect(data.cutime).toBe(0)
      expect(data.cstime).toBe(0)
      expect(data.rss).toBe(0)
      done()
    })
  })
})
