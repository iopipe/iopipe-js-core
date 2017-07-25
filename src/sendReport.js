import https from 'https';

import globals from './globals';

export function sendReport(requestBody, config, ipAddress) {
  return new Promise((resolve, reject) => {
    const req = https
      .request(
        {
          hostname: ipAddress,
          servername: config.host,
          path: config.path,
          port: 443,
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          agent: globals.httpsAgent,
          timeout: config.networkTimeout
        },
        res => {
          var apiResponse = '';

          res.on('data', chunk => {
            apiResponse += chunk;
          });

          res.on('end', () => {
            resolve({ status: res.statusCode, apiResponse });
          });
        }
      )
      .on('error', err => {
        reject(err);
      });

    req.write(JSON.stringify(requestBody));
    req.end();
  });
}
