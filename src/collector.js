var url = require('url')
var path = require('path')

function addPathToUrl(baseUrl) {
  var eventURL = url.parse(baseUrl)
  eventURL.pathname = path.join(eventURL.pathname, 'v0/event')
  eventURL.path = eventURL.search ? eventURL.pathname + eventURL.search : eventURL.pathname

  return eventURL
}

function getCollectorUrl(configUrl) {
  if (configUrl) {
    return addPathToUrl(configUrl)
  }

  var baseUrl = 'https://metrics-api.iopipe.com'
  var region = process.env.AWS_REGION || ''

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
