opts = {
  region: 'us-west-1',
  account: '123456789012',
  functionName: 'mockLambda',
  functionVersion: '$LATEST',
  memoryLimitInMB: '128'
}

const context = {
  // callbackWaitsForEmptyEventLoop: true,
  // functionName: opts.functionName,
  // functionVersion: opts.functionVersion,
  // invokedFunctionArn: `arn:aws:lambda:${opts.region}:${opts.account}:function:${opts.functionName}:${opts.alias || opts.functionVersion}`,
  // memoryLimitInMB: opts.memoryLimitInMB,
  // awsRequestId: '1',
  // invokeid: 'id',
  // logGroupName: `/aws/lambda/${opts.functionName}`,
  // getRemainingTimeInMillis: () => Math.floor(Math.random() * (3000 - 100)) + 100,
  succeed: result => {
    return result
  },
  fail: function(err) {
    if (typeof err === 'string') {
      err = new Error(err);
    }

    throw err
  }
}

const callback = (error, success) => {
  if(error) {
    if(typeof error == 'string')
      error = new Error(error)
    throw error
  }

  return success
}

exports.invoke = function(fun, event) {
  return fun.call(this, event, context, callback)
}