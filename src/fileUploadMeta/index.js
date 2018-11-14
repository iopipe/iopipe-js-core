import request from 'simple-get';

import { get } from '../invocationContext';
import getSigner from './getSigner';

export default function getFileUploadMeta(kwargs = {}) {
  return new Promise((resolve, reject) => {
    const url = getSigner();
    const context = get() || {};
    const {
      arn = context.invokedFunctionArn ||
        `arn:aws:lambda:local:0:function:${context.functionName}`,
      requestId = context.awsRequestId,
      timestamp = Date.now(),
      extension = '.zip',
      auth: authorization,
      method = 'POST',
      networkTimeout = 5000
    } = kwargs;

    const body = { arn, requestId, timestamp, extension };
    let headers = {};
    if (authorization) {
      headers = { authorization };
    }
    request.concat(
      { url, body, headers, method, json: true, timeout: networkTimeout },
      (err, res, data) => {
        return err ? reject(err) : resolve(data || {});
      }
    );
  });
}
