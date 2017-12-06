IOpipe Analytics & Distributed Tracing Agent
--------------------------------------------
[![Coverage Status](https://coveralls.io/repos/github/iopipe/iopipe/badge.svg?branch=master)](https://coveralls.io/github/iopipe/iopipe?branch=master)
[![npm version](https://badge.fury.io/js/iopipe.svg)](https://badge.fury.io/js/iopipe)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

This package provides analytics and distributed tracing for event-driven applications running on AWS Lambda.

# Installation & usage

Install by requiring this module, passing it an object with your project token ([register for access](https://www.iopipe.com)), and it will automatically monitor and collect metrics from your applications running on AWS Lambda.

If you are using the Serverless Framework to deploy your lambdas, check out our [serverless plugin](https://github.com/iopipe/serverless-plugin-iopipe).

Example:

```js
const iopipeLib = require('iopipe');

const iopipe = iopipeLib({ token: 'PROJECT_TOKEN' });

exports.handler = iopipe((event, context) => {
  context.succeed('This is my serverless function!');
});
```

# Configuration

#### `token` (string: required)

If not supplied, the environment variable `$IOPIPE_TOKEN` will be used if present. [Find your project token](https://dashboard.iopipe.com/install)

#### `timeoutWindow` (int: optional = 150)

By default, IOpipe will capture timeouts by exiting your function 150ms early from the AWS configured timeout, to allow time for reporting. You can disable this feature by setting `timeoutWindow` to `0` in your configuration. If not supplied, the environment variable `$IOPIPE_TIMEOUT_WINDOW` will be used if present.

```js
const iopipe = require('iopipe')({ token: 'PROJECT_TOKEN', timeoutWindow: 0})
```

#### `debug` (bool: optional = false)

Debug mode will log all data sent to IOpipe servers to STDOUT. This is also a good way to evaluate the sort of data that IOpipe is receiving from your application. If not supplied, the environment variable `$IOPIPE_DEBUG` will be used if present.

```js
const iopipe = require('iopipe')({
  token: 'PROJECT_TOKEN',
  debug: true
});

exports.handler = iopipe((event, context, callback) => {
  // Do things here. We'll log info to STDOUT.
});
```

#### `plugins` (array: optional)

Plugins can extend the functionality of IOpipe in ways that best work for you. Just follow the guides for the plugins listed below for proper usage:

- [Trace Plugin](https://github.com/iopipe/iopipe-plugin-trace)

Example:

```js
const tracePlugin = require('iopipe-plugin-trace');

const iopipe = require('iopipe')({
  token: 'PROJECT_TOKEN',
  plugins: [tracePlugin()]
});

exports.handler = iopipe((event, context, callback) => {
  // Run your fn here
});
```

# License

Apache 2.0
