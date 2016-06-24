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

# License

Apache 2.0

Copyright 2016 IOpipe, Inc.
