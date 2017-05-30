var url = require('url')
var path = require('path')

function getCollectorPath(baseUrl) {
  if (!baseUrl) {
    return '/v0/event'
  }

  var eventURL = url.parse(baseUrl)
  eventURL.pathname = path.join(eventURL.pathname, 'v0/event')
  eventURL.path = eventURL.search ? eventURL.pathname + eventURL.search : eventURL.pathname
  return eventURL.path
}

function getHostname(configUrl) {
  if (configUrl) {
    return url.parse(configUrl).hostname
  }

  var baseUrl = 'metrics-api.iopipe.com'
  var region = process.env.AWS_REGION || ''

  switch (region) {
  case 'ap-southeast-2':
    baseUrl = 'metrics-api.ap-southeast-2.iopipe.com'
    break
  case 'eu-west-1':
    baseUrl = 'metrics-api.eu-west-1.iopipe.com'
    break
  case 'us-east-2':
    baseUrl = 'metrics-api.us-east-2.iopipe.com'
    break
  case 'us-west-1':
    baseUrl = 'metrics-api.us-west-1.iopipe.com'
    break
  case 'us-west-2':
    baseUrl = 'metrics-api.us-west-2.iopipe.com'
    break
  default:
    baseUrl = 'metrics-api.iopipe.com'
  }

  return baseUrl
}

module.exports = {
  getHostname,
  getCollectorPath
}
