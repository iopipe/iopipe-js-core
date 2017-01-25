var url = require('url')
var path = require('path')

// Function regex according to Amazon:
// https://docs.aws.amazon.com/lambda/latest/dg/API_UpdateFunctionConfiguration.html
const arnExpression = /(arn:aws:lambda:)?([a-z]{2}-[a-z]+-\d{1}:)?(\d{12}:)?(function:)?([a-zA-Z0-9-_]+)(:(\$LATEST|[a-zA-Z0-9-_]+))?/

function arnToRegion(arn){
  if (!arn) return ''

  var splitArn = arn.match(arnExpression)
  // guard to make sure we have a match in the region section
  if (splitArn[2]) {
    return splitArn[2].replace(':', '')
  }
  return ''
}

function addPathToUrl(baseUrl) {
  var eventURL = url.parse(baseUrl)
  eventURL.pathname = path.join(eventURL.pathname, 'v0/event')
  eventURL.path = eventURL.search ? eventURL.pathname + eventURL.search : eventURL.pathname

  return eventURL
}

function getCollectorUrl(configUrl, context) {
  if (configUrl) {
    return addPathToUrl(configUrl)
  }

  var baseUrl = 'https://metrics-api.iopipe.com'
  var region = context ? arnToRegion(context.invokedFunctionArn) : ''

  switch (region) {
  case 'ap-southeast-2':
    baseUrl = 'https://metrics-api.ap-southeast-2.iopipe.com'
    break
  case 'eu-west-1':
    baseUrl = 'https://metrics-api.eu-west-1.iopipe.com'
    break
  case 'us-east-2':
    baseUrl = 'https://metrics-api.us-east-2.iopipe.com'
    break
  case 'us-west-1':
    baseUrl = 'https://metrics-api.us-west-1.iopipe.com'
    break
  case 'us-west-2':
    baseUrl = 'https://metrics-api.us-west-2.iopipe.com'
    break
  default:
    baseUrl = 'https://metrics-api.iopipe.com'
  }

  return addPathToUrl(baseUrl)
}

module.exports = getCollectorUrl
