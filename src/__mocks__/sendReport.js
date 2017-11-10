import _ from 'lodash';

const reports = [];

function sendReport(requestBody, config, ipAddress) {
  return new Promise(resolve => {
    const data = _.assign({}, requestBody, {
      _meta: {
        config,
        ipAddress
      }
    });
    // use a timeout to emulate some amount of network latency for the report send
    // especially useful for class.test.js - proper timeout reporting
    setTimeout(() => {
      reports.push(data);
      resolve({
        status: 200
      });
    }, 10);
  });
}

export { reports, sendReport };
