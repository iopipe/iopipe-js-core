const iopipe = require('../dist/iopipe')({
  debug: true,
  token: process.env.IOPIPE_TOKEN || 'testSuite'
});

module.exports.callback = iopipe((event, context, callback) => {
  context.iopipe.log('custom_metric', 'A custom metric for callback');
  context.iopipe.metric(
    'custom_metric_with_metric',
    'A custom metric for callback'
  );
  context.iopipe.label('callback');
  callback(null, 'callback');
});

module.exports.succeed = iopipe((event, context) => {
  context.iopipe.log('custom_metric', 'A custom metric for succeed');
  context.iopipe.metric(
    'custom_metric_with_metric',
    'A custom metric for succeed'
  );
  context.iopipe.label('succeed');
  context.succeed('context.succeed');
});

module.exports.fail = iopipe((event, context) => {
  context.iopipe.log('custom_metric', 'A custom metric for fail');
  context.iopipe.metric(
    'custom_metric_with_metric',
    'A custom metric for fail'
  );
  context.iopipe.label('fail');
  context.fail('context.fail');
});

module.exports.done = iopipe((event, context) => {
  context.iopipe.log('custom_metric', 'A custom metric for done');
  context.iopipe.metric(
    'custom_metric_with_metric',
    'A custom metric for done'
  );
  context.iopipe.label('done');
  context.done(null, 'context.done');
});
