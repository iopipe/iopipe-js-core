'use strict';
var iopipe = require('./iopipe')({
  debug: true
});

module.exports.simpleSuccess = iopipe((event, context, callback) => {
  iopipe.log('custom_metric', 'A custom metric')
  callback(null, { message: 'Successful invocation', event });
});
