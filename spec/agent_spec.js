const IOpipe = require('..')
const context = require('aws-lambda-mock-context')
// default region for testing
process.env.AWS_REGION = 'us-east-1'

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

  it('allows .decorate API', function(done) {
    var iopipe = IOpipe({ clientId: 'testSuite' })
    var ctx = context()
    var wrappedFunction = iopipe.decorate(function(event, context) {
      context.succeed(true)
    })

    wrappedFunction({}, ctx)

    ctx.Promise
      .then(resp => { expect(resp).toBeTruthy(); done() })
      .catch(err => { expect(err).toBe(null); done() })  })
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
    it('will run when installed on a successful function', (done) => {
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

  describe('sends to specified regions', function() {
    it('sends to ap-southeast-2', function(done) {
      var iopipe = IOpipe({ clientId: 'testSuite' })
      process.env.AWS_REGION = 'ap-southeast-2'
      var ctx = context({ region: 'ap-southeast-2'})
      var wrappedFunction = iopipe.decorate(function(event, context) {
        context.succeed(true)
      })

      wrappedFunction({}, ctx)

      ctx.Promise
        .then(resp => { expect(resp).toBeTruthy(); done() })
        .catch(err => { expect(err).toBe(null); done() })
    })

    it('sends to eu-west-1', function(done) {
      var iopipe = IOpipe({ clientId: 'testSuite' })
      process.env.AWS_REGION = 'eu-west-1'
      var ctx = context({ region: 'eu-west-1'})
      var wrappedFunction = iopipe.decorate(function(event, context) {
        context.succeed(true)
      })

      wrappedFunction({}, ctx)

      ctx.Promise
        .then(resp => { expect(resp).toBeTruthy(); done() })
        .catch(err => { expect(err).toBe(null); done() })
    })

    it('sends to us-east-1/our default URL', function(done) {
      var iopipe = IOpipe({ clientId: 'testSuite' })
      process.env.AWS_REGION = 'us-east-1'
      var ctx = context({ region: 'us-east-1'})
      var wrappedFunction = iopipe.decorate(function(event, context) {
        context.succeed(true)
      })

      wrappedFunction({}, ctx)

      ctx.Promise
        .then(resp => { expect(resp).toBeTruthy(); done() })
        .catch(err => { expect(err).toBe(null); done() })
    })

    it('sends to us-east-2', function(done) {
      var iopipe = IOpipe({ clientId: 'testSuite' })
      process.env.AWS_REGION = 'us-east-2'
      var ctx = context({ region: 'us-east-2'})
      var wrappedFunction = iopipe.decorate(function(event, context) {
        context.succeed(true)
      })

      wrappedFunction({}, ctx)

      ctx.Promise
        .then(resp => { expect(resp).toBeTruthy(); done() })
        .catch(err => { expect(err).toBe(null); done() })
    })


    it('sends to us-west-1', function(done) {
      var iopipe = IOpipe({ clientId: 'testSuite' })
      process.env.AWS_REGION = 'us-west-1'
      var ctx = context({ region: 'us-west-1' })
      var wrappedFunction = iopipe.decorate(function(event, context) {
        context.succeed(true)
      })

      wrappedFunction({}, ctx)

      ctx.Promise
        .then(resp => { expect(resp).toBeTruthy(); done() })
        .catch(err => { expect(err).toBe(null); done() })
    })

    it('sends to us-west-2', function(done) {
      var iopipe = IOpipe({ clientId: 'testSuite' })
      process.env.AWS_REGION = 'us-west-2'
      var ctx = context({ region: 'us-west-2' })
      var wrappedFunction = iopipe.decorate(function(event, context) {
        context.succeed(true)
      })

      wrappedFunction({}, ctx)

      ctx.Promise
        .then(resp => { expect(resp).toBeTruthy(); done() })
        .catch(err => { expect(err).toBe(null); done() })
    })
  })
})
