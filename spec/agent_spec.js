var agent = require('..').agent

describe('settings', () => {
  it('is an object', () => {
    expect(typeof agent.settings).toEqual('object')
  })

  it('does not define clientId by default', () => {
    expect(agent.settings.clientId).toBe(undefined)
  })
})

describe('set client id', () => {
  it('sets the user id in the settings block', () => {
    var clientId = 'some-id-here'
    agent.setClientId(clientId)

    expect(agent.settings.clientId).toEqual(clientId)
  })
})

describe('metrics agent', () => {

  beforeEach(() => {
    // Reset settings
    agent.settings = {}
  })

  it('will not wrap a function if client id is not set', () => {
    expect(agent.main).toThrow(new Error("Make sure your client id is set"))
  })

  it('should return a function', () => {
    agent.setClientId("some-id-here")
    var wrappedFunction = agent.main()
    expect(typeof wrappedFunction).toEqual('function')
  })
})