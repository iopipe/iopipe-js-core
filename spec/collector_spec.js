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

  it('switches based on the region in the ARN', function() {
    var apSoutheast2Context = { invokedFunctionArn: 'arn:aws:lambda:ap-southeast-2:123456789012:function:aws-lambda-mock-context:$LATEST' }
    var euWest1Context = { invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789012:function:aws-lambda-mock-context:$LATEST' }
    var east1Context = { invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:aws-lambda-mock-context:$LATEST' }
    var east2Context = { invokedFunctionArn: 'arn:aws:lambda:us-east-2:123456789012:function:aws-lambda-mock-context:$LATEST' }
    var west1Context = { invokedFunctionArn: 'arn:aws:lambda:us-west-1:123456789012:function:aws-lambda-mock-context:$LATEST' }
    var west2Context = { invokedFunctionArn: 'arn:aws:lambda:us-west-2:123456789012:function:aws-lambda-mock-context:$LATEST' }

    expect(collector('', apSoutheast2Context).href).toBe('https://metrics-api.ap-southeast-2.iopipe.com/')
    expect(collector('', euWest1Context).href).toBe('https://metrics-api.eu-west-1.iopipe.com/')
    expect(collector('', east1Context).href).toBe('https://metrics-api.us-east-1.iopipe.com/')
    expect(collector('', east2Context).href).toBe('https://metrics-api.us-east-2.iopipe.com/')
    expect(collector('', west1Context).href).toBe('https://metrics-api.us-west-1.iopipe.com/')
    expect(collector('', west2Context).href).toBe('https://metrics-api.us-west-2.iopipe.com/')
  })

  it('defaults if an uncovered region or malformed', function() {
    var context = {
      invokedFunctionArn: 'arn:aws:lambda:ap-east-1:123456789012:function:aws-lambda-mock-context:$LATEST'
    }

    var contextBadArn = {
      invokedFunctionArn: 'this-isnt-even-an-arn'
    }

    var contextNoArn = {}

    expect(collector('', context).href).toBe('https://metrics-api.iopipe.com/')
    expect(collector('', contextBadArn).href).toBe('https://metrics-api.iopipe.com/')
    expect(collector('', contextNoArn).href).toBe('https://metrics-api.iopipe.com/')
  })
})
