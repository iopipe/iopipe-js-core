import request from 'simple-get';

import getSigner from './getSigner';

export default function getFileUploadMeta(kwargs = {}) {
  return new Promise((resolve, reject) => {
    const url = getSigner();
    const {
      arn,
      requestId,
      timestamp,
      extension = '.zip',
      auth: authorization,
      method = 'POST'
    } = kwargs;
    const body = JSON.stringify({ arn, requestId, timestamp, extension });
    let headers = {};
    if (authorization) {
      headers = { authorization };
    }
    request.concat(
      { url, body, headers, method, json: true },
      (err, res, data) => {
        return err ? reject(err) : resolve(data || {});
      }
    );
  });
}
