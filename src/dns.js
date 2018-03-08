import dns from 'dns';

const promiseInstances = undefined;

function getDnsPromise(host) {
  return new Promise((resolve, reject) => {
    dns.lookup(host, (err, address) => {
      if (err) {
        reject(err);
      }
      resolve(address);
    });
  });
}

export { getDnsPromise, promiseInstances };
