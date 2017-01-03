const IOpipe = require('..')
const context = require('aws-lambda-mock-context')

describe('metrics agent', () => {
  it('should return a function', () => {
    var agent = IOpipe()
    expect(typeof agent).toEqual('function')
  })

  it('should successfully getRemainingTimeInMillis from aws context', () => {
    var iopipe = IOpipe({ clientId: 'testSuite' })
    var ctx = context()
    var wrappedFunction = iopipe(function(event, context) {
      context.succeed()
    })

    wrappedFunction({}, ctx)

    expect(typeof ctx.getRemainingTimeInMillis).toBe('function')
  })
})

describe('smoke test', () => {
  describe('successful functions', () => {
    var functionResponse = null
    var functionError = null

    beforeEach(function(done) {
      const ctx = context()
      var iopipe = IOpipe({ clientId: 'testSuite', debug: true})
      var wrappedFunction = iopipe(function(event, context, callback) {
        context.succeed('Success!')
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
      expect(functionResponse).toEqual('Success!')
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
      var iopipe = IOpipe({ clientId: 'testSuite', debug: true})
      var wrappedFunction = iopipe(function(event, context, callback) {
        context.fail('Fail!')
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
      expect(functionError.message).toEqual('Fail!')
      done()
    })
  })

  describe('functions using callbacks', () => {
    it('will run when installed on a sucessfull function', (done) => {
      const ctx = context()
      function cb(err, success) {
        if(err)
          ctx.fail(err)
        else
          ctx.succeed(success)
      }
      var iopipe = IOpipe({ clientId: 'testSuite', debug: true})
      var wrappedFunction = iopipe(function(event, context, callback) {
        callback(null, 'Success callback!')
      })
      wrappedFunction({}, ctx, cb)
      ctx.Promise
        .then(resp => {
          expect(resp).toEqual('Success callback!')
          done()
        })
        .catch(err => {
          expect(err).toBe(null)
          done()
        })
    })
  })
})
