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
const iopipeLib = require('@iopipe/core');

const iopipe = iopipeLib({ token: 'PROJECT_TOKEN' });

exports.handler = iopipe((event, context) => {
  context.succeed('This is my serverless function!');
});
```

# Configuration

## Methods

You can configure your iopipe setup through one or more different methods - that can be mixed, providing a config chain. The current methods are listed below, in order of precendence. The module instantiation object overrides all other config values (if values are provided).

1. Module instantiation object
2. `IOPIPE_*` environment variables
3. [An `.iopiperc` file](#rc-file-configuration)
4. [An `iopipe` package.json entry](#packagejson-configuration)
5. [An `extends` key referencing a config package](#extends-configuration)
6. Default values

## Options

#### `token` (string: required)

If not supplied, the environment variable `$IOPIPE_TOKEN` will be used if present. [Find your project token](https://dashboard.iopipe.com/install)

#### `timeoutWindow` (int: optional = 150)

By default, IOpipe will capture timeouts by exiting your function 150ms early from the AWS configured timeout, to allow time for reporting. You can disable this feature by setting `timeoutWindow` to `0` in your configuration. If not supplied, the environment variable `$IOPIPE_TIMEOUT_WINDOW` will be used if present.

```js
const iopipe = require('@iopipe/core')({ token: 'PROJECT_TOKEN', timeoutWindow: 0})
```

#### `debug` (bool: optional = false)

Debug mode will log all data sent to IOpipe servers to STDOUT. This is also a good way to evaluate the sort of data that IOpipe is receiving from your application. If not supplied, the environment variable `$IOPIPE_DEBUG` will be used if present.

```js
const iopipe = require('@iopipe/core')({
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
const tracePlugin = require('@iopipe/trace');

const iopipe = require('@iopipe/core')({
  token: 'PROJECT_TOKEN',
  plugins: [tracePlugin()]
});

exports.handler = iopipe((event, context, callback) => {
  // Run your fn here
});
```

## RC File Configuration

You can configure iopipe via an `.iopiperc` RC file. [An example of that is here](https://github.com/iopipe/iopipe-js-core/blob/master/testProjects/rcFileConfig/.iopiperc). Config options are the same as the module instantiation object, except for plugins. Plugins should be an array containing mixed-type values. A plugin value can be a:
- String that is the name of the plugin
- Or an array with plugin name first, and plugin options second

```json
{
  "token": "wow_token",
  "plugins": [
    "@iopipe/trace",
    ["@iopipe/profiler", {"enabled": true}]
  ]
}
```

**IMPORTANT**: You must install the plugins as dependencies for them to load properly in your environment.

## package.json Configuration

You can configure iopipe within a `iopipe` package.json entry. [An example of that is here](https://github.com/iopipe/iopipe/blob/master/testProjects/packageJsonConfig/package.json#L10). Config options are the same as the module instantiation object, except for plugins. Plugins should be an array containing mixed-type values. A plugin value can be a:
- String that is the name of the plugin
- Or an array with plugin name first, and plugin options second

```json
{
  "name": "my-great-package",
  "dependencies": {
    "@iopipe/trace": "^0.2.0",
    "@iopipe/profiler": "^0.1.0"
  },
  "iopipe": {
    "token": "wow_token",
    "plugins": [
      "@iopipe/trace",
      ["@iopipe/profiler", {"enabled": true}]
    ]
  }
}
```

**IMPORTANT**: You must install the plugins as dependencies for them to load properly in your environment.

## Extends Configuration

You can configure iopipe within a package.json or rc file by referencing a `extends` config package. [An example of that is here](https://github.com/iopipe/iopipe-js-core/blob/master/testProjects/extendConfig/package.json#L15). Config options are the same as the module instantiation object, except for plugins. Plugins should be an array containing mixed-type values. A plugin value can be a:
- String that is the name of the plugin
- Or an array with plugin name first, and plugin options second

For an example of a config package, check out [@iopipe/config](https://github.com/iopipe/iopipe-js-config).

**IMPORTANT**: You must install the config package and plugins as dependencies for them to load properly in your environment.

# License

Apache 2.0
