const IOpipe = require('..')
const context = require('aws-lambda-mock-context')

describe('metrics agent', () => {
  it('should return an Object', () => {
    var agent = new IOpipe.Agent()
    expect(typeof agent).toEqual('object')
  })

  it('should successfully getRemainingTimeInMillis from aws context', (done) => {
    var iopipe = new IOpipe.Agent({ clientId: 'testSuite' })
    var ctx = context()
    var wrappedFunction = iopipe.wrap(function(event, context) {
        console.log('foo!')
        expect(context.getRemainingTimeInMillis()).toEqual(9001)
      }
    )

    wrappedFunction({}, ctx)

    ctx.Promise
      .then(resp => {
        functionResponse = resp;
        expect(ctx.getRemainingTimeInMillis()).toEqual(9001)
        done()
      })
      .catch(err => { functionError = err; done() })
  });
})

xdescribe('smoke test', () => {
  describe('successful functions', () => {
    var functionResponse = null
    var functionError = null

    beforeEach(function(done) {
      const ctx = context()
      var iopipe = new IOpipe.Agent({ clientId: 'testSuite'})
      var wrappedFunction = iopipe.wrap(function(event, context, callback) {
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
      var iopipe = new IOpipe.Agent({ clientId: 'testSuite'})
      var wrappedFunction = iopipe.wrap(function(event, context, callback) {
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

  describe('functions using callbacks', () => {
    it('will run when installed on a sucessfull function', (done) => {
      const ctx = context()
      function cb(err, success) {
        if(err)
          ctx.fail(err)
        else
          ctx.succeed(success)
      }
      var iopipe = new IOpipe.Agent({ clientId: 'testSuite'})
      var wrappedFunction = iopipe.wrap(function(event, context, callback) {
        callback(null, "Success callback!")
      })
      wrappedFunction({}, ctx, cb)
      ctx.Promise
        .then(resp => {
          expect(resp).toEqual("Success callback!")
          done()
        })
        .catch(err => {
          expect(err).toBe(null)
          done()
        })
    })

    it('will run when installed on a sucessfull function', (done) => {
      const ctx = context()
      function cb(err, success) {
        if(err)
          ctx.fail(err)
        else
          ctx.succeed(success)
      }
      var iopipe = IOpipe.Agent({ clientId: 'testSuite'})
      var wrappedFunction = iopipe.wrap(function(event, context, callback) {
        callback("Error callback!")
      })
      wrappedFunction({}, ctx, cb)
      ctx.Promise
        .then(resp => {
          expect(resp).toBe(null)
          done()
        })
        .catch(err => {
          expect(err.message).toEqual("Error callback!")
          done()
        })
    })

    it('will run in debug mode when installed on a sucessfull function', (done) => {
      const ctx = context()
      function cb(err, success) {
        if(err)
          ctx.fail(err)
        else
          ctx.succeed(success)
      }
      var iopipe = IOpipe.Agent({ clientId: 'testSuite', debug: true })
      var wrappedFunction = iopipe.wrap(function(event, context, callback) {
        callback("Error callback!")
      })
      wrappedFunction({}, ctx, cb)
      ctx.Promise
        .then(resp => {
          expect(resp).toBe(null)
          done()
        })
        .catch(err => {
          expect(err.message).toEqual("Error callback!")
          done()
        })
    })
  })
})
