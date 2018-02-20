/*eslint-disable no-unreachable*/

throw new TypeError('wow-great-type-error');

module.exports = (event, context) => {
  context.succeed();
};
