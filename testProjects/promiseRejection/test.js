const mockContext = require('aws-lambda-mock-context');
const iopipe = require('./iopipe');
/*eslint-disable no-process-exit*/
/*eslint-disable no-console*/

const invocations = [];

const handler = iopipe({
  token: 'test',
  plugins: [
    inv => {
      invocations.push(inv);
    }
  ]
})((event, context) => {
  const prom = new Promise(() => {
    throw new Error('An error from a promise');
  });
  prom.then(context.succeed);
});

const ctx = mockContext({ timeout: 1 });
handler({}, ctx);

process.on('unhandledRejection', () => {
  setTimeout(() => {
    if (
      invocations[0].report.report.errors.message === 'An error from a promise'
    ) {
      process.exit(0);
    }
    console.error('Promise Error was NOT caught by iopipe.');
    process.exit(1);
  }, 10);
});
