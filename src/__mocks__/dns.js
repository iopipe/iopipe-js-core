import dns from 'dns';

let promiseInstances = [];

function getDnsPromise(host) {
  const prom = new Promise((resolve, reject) => {
    dns.lookup(host, (err, address) => {
      if (err) {
        reject(err);
      }
      resolve(address);
    });
  });
  promiseInstances.push(prom);
  return prom;
}

export { getDnsPromise, promiseInstances };
