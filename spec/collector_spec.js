var collector = require('../src/collector.js')

describe('configuring collector url', function() {
  it('returns a base url if nothing else', function() {
    expect(collector().href).toBe('https://metrics-api.iopipe.com/')
  })

  it('returns a configured url if provided in config object', function() {
    expect(collector('http://myurl').href).toBe('http://myurl/')
  })

  it('adds query strings to the path', function() {
    expect(collector('http://myurl?foo').path).toBe('/v0/event?foo')
  })

  it('switches based on the region set in env vars', function() {
    process.env.AWS_REGION = 'ap-southeast-2'
    var apSoutheast2Collector = collector('', {})
    process.env.AWS_REGION = 'eu-west-1'
    var euWest1Collector = collector('', {})
    process.env.AWS_REGION = 'us-east-2'
    var east2Collector = collector('', {})
    process.env.AWS_REGION = 'us-west-1'
    var west1Collector = collector('', {})
    process.env.AWS_REGION = 'us-west-2'
    var west2Collector = collector('', {})

    expect(apSoutheast2Collector.href).toBe('https://metrics-api.ap-southeast-2.iopipe.com/')
    expect(euWest1Collector.href).toBe('https://metrics-api.eu-west-1.iopipe.com/')
    expect(east2Collector.href).toBe('https://metrics-api.us-east-2.iopipe.com/')
    expect(west1Collector.href).toBe('https://metrics-api.us-west-1.iopipe.com/')
    expect(west2Collector.href).toBe('https://metrics-api.us-west-2.iopipe.com/')
  })

  it('defaults if an uncovered region or malformed', function() {
    process.env.AWS_REGION = 'eu-west-2'
    var euWest2Collector = collector('', {})

    process.env.AWS_REGION = 'NotARegion'
    var notRegionCollector = collector('', {})

    process.env.AWS_REGION = ''
    var emptyRegionCollector = collector('', {})

    expect(euWest2Collector.href).toBe('https://metrics-api.iopipe.com/')
    expect(notRegionCollector.href).toBe('https://metrics-api.iopipe.com/')
    expect(emptyRegionCollector.href).toBe('https://metrics-api.iopipe.com/')
  })
})
