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
    setTimeout(() => {
      reports.push(data);
      resolve({
        status: 200
      });
    }, 10);
  });
}

export { reports, sendReport };
