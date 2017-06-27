function Callback(generateLog, callback) {
  if (typeof callback !== 'function') {
    return undefined;
  }
  return (err, data) => {
    generateLog(err, () => {
      callback.apply(callback, [err, data]);
    });
  };
}

module.exports = Callback;
