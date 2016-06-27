var agent = require('..')

describe('metrics agent', () => {
  it('should return a function', () => {
    var wrappedFunction = agent()
    expect(typeof wrappedFunction).toEqual("function")
  })
})