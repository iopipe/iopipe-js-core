import _ from 'lodash';

const reports = [];

function sendReport(requestBody, config, ipAddress) {
  const data = _.assign({}, requestBody, {
    _meta: {
      config,
      ipAddress
    }
  });
  reports.push(data);
  return Promise.resolve({
    status: 200
  });
}

export { reports, sendReport };
