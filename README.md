IOpipe Analytics Agent
----------------------
[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg?maxAge=2592000)](https://gitter.im/iopipe/iopipe)

This package provides analytics for event-driven, "serverless" applications.

# Installation & usage

Installation is simple. Just require this module and it will
automatically monitor and collect metrics from your application
running on AWS Lambda, Google Cloud Functions, Azure, or any
other "serverless" environment.

Example:

```javascript
var ioipe_metrics = require("iopipe-agent-node")

module.exports = iopipe_metrics(
  function(event, context){
    context.succeed("This is my serverless function!")
  }
)
```

# Data reported

The following is provided to the collector service,
either the IOpipe Telemetry Service or the [open serverless
collector](https://github.com/iopipe/iopipe-collector).

 - function_id
 - environment  (restricted view of Node's process var)
 - errors
 - events       (custom events sent via `.emit('event', [data])`
 - time_sec_nanosec  (execution time: [secs, nanosecs])
 - time_sec          (execution time: secs)
 - time_nanosec      (execution time: nanosecs)

# License

Apache 2.0

Copyright 2016 IOpipe, Inc.
