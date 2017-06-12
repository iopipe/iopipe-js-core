const setConfig = require('../src/config.js')

describe('setting up config object', function() {
  beforeEach(function() {
    delete process.env.IOPIPE_TOKEN
    delete process.env.IOPIPE_CLIENTID
    delete process.env.IOPIPE_TIMEOUT_WINDOW
  })

  it('can accept 0 arguments and returns default config', function() {
    expect(setConfig()).toEqual({
      host: 'metrics-api.iopipe.com',
      path: '/v0/event',
      clientId: '',
      debug: false,
      networkTimeout: 5000,
      timeoutWindow: 150,
      installMethod: 'manual'
    })
  })

  it('configures a client id', function() {
    expect(setConfig({token:'foo'}).clientId).toEqual('foo')
    expect(setConfig({clientId: 'bar'}).clientId).toEqual('bar')
  })

  it('sets preferences for order of client id config', function() {
    // takes token over clientId
    expect(setConfig({clientId: 'bar', token: 'foo'}).clientId).toEqual('foo')

    process.env['IOPIPE_CLIENTID'] = 'qux'
    expect(setConfig().clientId).toEqual('qux')

    // takes IOPIPE_TOKEN over IOPIPE_CLIENTID
    process.env['IOPIPE_TOKEN'] = 'baz'
    expect(setConfig().clientId).toEqual('baz')
  })

  it('sets timeout windows', function() {
    expect(setConfig({timeoutWindow: 0}).timeoutWindow).toEqual(0)

    process.env.IOPIPE_TIMEOUT_WINDOW = 100
    expect(setConfig().timeoutWindow).toEqual(100)
    // prefers configuration over environment variables
    expect(setConfig({timeoutWindow: 0}).timeoutWindow).toEqual(0)
  })
})
