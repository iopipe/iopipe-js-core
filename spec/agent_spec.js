var agent = require('..')
const context = require('aws-lambda-mock-context')

describe('metrics agent', () => {
  it('should return a function', () => {
    var wrapper = agent()
    expect(typeof wrapper).toEqual('function')
  })
})

describe('smoke test', () => {
  describe('successful functions', () => { 
    var functionResponse = null
    var functionError = null

    beforeEach(function(done) {
      const ctx = context()
      var iopipe = agent({ clientId: 'testSuite'})
      var wrappedFunction = iopipe(function(event, context, callback) {
        context.succeed("Success!")
      })
      wrappedFunction({}, ctx)
      ctx.Promise
        .then(resp => { functionResponse = resp; done() })  
        .catch(err => { functionError = err; done() })  
    })

    afterEach(function() {
      functionResponse = null
      functionError = null
    })

    it('will run when installed on a successful function', (done) => {
      expect(functionResponse).toEqual("Success!")
      expect(functionError).toBe(null)
      done()
    })
  })

  describe('failing functions', () => { 
    var functionResponse = null
    var functionError = null

    beforeEach(function(done) {
      const ctx = context()
      functionResponse = null
      functionError = null
      var iopipe = agent({ clientId: 'testSuite'})
      var wrappedFunction = iopipe(function(event, context, callback) {
        context.fail("Fail!")
      })
      wrappedFunction({}, ctx)
      ctx.Promise
        .then(resp => { functionResponse = resp; done() })  
        .catch(err => { functionError = err; done() })  
    })

    afterEach(function() {
      functionResponse = null
      functionError = null
    })

    it('will run when installed on a failing function', (done) => {
      expect(functionResponse).toEqual(null)
      expect(functionError.message).toEqual("Fail!")
      done()
    })
  })
})
