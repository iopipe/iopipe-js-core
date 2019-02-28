/*eslint-disable import/prefer-default-export*/
import https from 'https';

import { httpsAgent } from './globals';

const reports = undefined;

function sendReport(requestBody, config, ipAddress) {
  return new Promise((resolve, reject) => {
    const req = https
      .request(
        {
          hostname: ipAddress,
          servername: config.host,
          path: config.path,
          port: 443,
          method: 'POST',
          headers: {
            authorization: `Bearer ${config.clientId}`,
            'content-type': 'application/json'
          },
          agent: httpsAgent
        },
        res => {
          let apiResponse = '';

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
      })
      .setTimeout(config.networkTimeout, () => {
        req.abort();
      });

    req.write(JSON.stringify(requestBody));
    req.end();
  });
}

export { reports, sendReport };
