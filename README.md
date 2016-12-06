IOpipe Analytics & Distributed Tracing Agent
--------------------------------------------
[![Coverage Status](https://coveralls.io/repos/github/iopipe/iopipe/badge.svg?branch=coveralls)](https://coveralls.io/github/iopipe/iopipe?branch=coveralls)

This package provides analytics and distributed tracing for
event-driven applications running on AWS Lambda.

# Installation & usage

Installation is simple. Just require this module with your client id
([register for access](https://www.iopipe.com)) and it will
automatically monitor and collect metrics from your application
running on AWS Lambda.

Example:

```javascript
var iopipe = require("iopipe")({ clientId: "YOUR_ID"})

exports.handle = iopipe(
  function (event, context) {
    context.succeed("This is my serverless function!")
  }
)
```

# Environment-based config

This library will look for an environment variable,
`IOPIPE_CLIENTID` and will use this if one is not
explicitly passed to the configuration object.

This is an easy way to separate configuration from
code.

```javascript
exports.handle = require("iopipe")()(
  function (event, context, callback) {
    // Do things here. Nothing will be reported.
  }
)
```

# Debugging integration

Debugging is possible by seeing the `debug` key to `true`
in the configuration as such, which will log all data sent to
IOpipe servers to STDOUT. This is also a good way to evaluate
the sort of data that IOpipe is receiving from your application.

Debugging is also enabled if the the environment variable,
`IOPIPE_DEBUG` is set to a truthful value.

```javascript
exports.handle = require("iopipe")({ debug: true })(
  function (event, context, callback) {
    // Do things here. We'll log info to STDOUT.
  }
)
```

# Data reported

The following is provided to IOpipe:

 - function_id (a hashed identifier of the function)
 - client_id (your client id, common among all your functions)
 - errors
 - events       (custom events sent via `.emit('event', [data])`
 - time_sec_nanosec  (execution time: [secs, nanosecs])
 - time_sec          (execution time: secs)
 - time_nanosec      (execution time: nanosecs)

# License

Apache 2.0
