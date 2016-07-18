IOpipe Analytics & Distributed Tracing Agent
--------------------------------------------
[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg?maxAge=2592000)](https://gitter.im/iopipe/iopipe)

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
