const AWS = require('aws-sdk');
const every = require('lodash.every');

const lambda = new AWS.Lambda();

const awsId = process.env.AWS_ID;
if (!awsId) {
  throw new Error('No AWS account id supplied to process.env.AWS_ID');
}

const base = `arn:aws:lambda:us-west-2:${awsId}:function:iopipe-lib-master-acceptance-test-prod-`;

const arns = ['callback', 'contextSuccess', 'contextFail', 'contextDone'].map(
  str => `${base}${str}`
);

function executeUploaded() {
  console.log('Running acceptance test invocations');
  Promise.all(
    arns.map(arn => {
      return lambda
        .invoke({
          InvocationType: 'RequestResponse',
          FunctionName: arn,
          Payload: JSON.stringify({ test: true })
        })
        .promise();
    })
  )
    .then(([fn1, fn2, fn3, fn4]) => {
      const bool = every([
        fn1.StatusCode === 200,
        fn1.Payload === '"callback"',
        fn2.StatusCode === 200,
        fn2.Payload === '"context.succeed"',
        fn3.StatusCode === 200,
        fn3.FunctionError === 'Handled',
        fn3.Payload === JSON.stringify({ errorMessage: 'context.fail' }),
        fn4.StatusCode === 200,
        fn4.Payload === '"context.done"'
      ]);
      if (bool) {
        console.log('Acceptance test passed.');
        return process.exit(0);
      }
      console.error('Acceptance test failed.');
      console.error('Results: ', JSON.stringify([fn1, fn2, fn3, fn4]));
      return process.exit(1);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

executeUploaded();
