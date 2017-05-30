var { getHostname, getCollectorPath } = require('../src/collector.js')

describe('configuring collector hostname', function() {
  beforeEach(function() {
    // clear region for testing
    process.env.AWS_REGION = ''
  })

  it('returns a base hostname if nothing else', function() {
    expect(getHostname()).toBe('metrics-api.iopipe.com')
  })

  it('returns a configured url if provided in config object', function() {
    expect(getHostname('http://myurl')).toBe('myurl')
  })

  it('switches based on the region set in env vars', function() {
    process.env.AWS_REGION = 'ap-southeast-2'
    var apSoutheast2Collector = getHostname('', {})
    process.env.AWS_REGION = 'eu-west-1'
    var euWest1Collector = getHostname('', {})
    process.env.AWS_REGION = 'us-east-2'
    var east2Collector = getHostname('', {})
    process.env.AWS_REGION = 'us-west-1'
    var west1Collector = getHostname('', {})
    process.env.AWS_REGION = 'us-west-2'
    var west2Collector = getHostname('', {})

    expect(apSoutheast2Collector).toBe('metrics-api.ap-southeast-2.iopipe.com')
    expect(euWest1Collector).toBe('metrics-api.eu-west-1.iopipe.com')
    expect(east2Collector).toBe('metrics-api.us-east-2.iopipe.com')
    expect(west1Collector).toBe('metrics-api.us-west-1.iopipe.com')
    expect(west2Collector).toBe('metrics-api.us-west-2.iopipe.com')
  })

  it('defaults if an uncovered region or malformed', function() {
    process.env.AWS_REGION = 'eu-west-2'
    var euWest2Collector = getHostname('', {})

    process.env.AWS_REGION = 'NotARegion'
    var notRegionCollector = getHostname('', {})

    process.env.AWS_REGION = ''
    var emptyRegionCollector = getHostname('', {})

    expect(euWest2Collector).toBe('metrics-api.iopipe.com')
    expect(notRegionCollector).toBe('metrics-api.iopipe.com')
    expect(emptyRegionCollector).toBe('metrics-api.iopipe.com')
  })
})

describe('configuring path', function() {
  it('adds query strings to the path', function() {
    expect(getCollectorPath('http://myurl?foo')).toBe('/v0/event?foo')
  })
})
