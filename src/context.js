'use strict';

function clone(oldObject) {
  // Basis.
  var clonedObject;
  var Constructor = oldObject.constructor;
  if (!(oldObject instanceof Object)) {
    return oldObject;
  }

  // Filter out special objects.
  switch (Constructor) {
    // Implement other special objects here.
    case Promise:
      clonedObject = oldObject.then();
      break;
    case Date:
      clonedObject = new Constructor(oldObject.getTime());
      break;
    default:
      clonedObject = new Constructor();
  }

  // Clone each property.
  /*eslint-disable guard-for-in*/
  /*eslint-disable vars-on-top*/
  for (var prop in oldObject) {
    clonedObject[prop] = clone(oldObject[prop]);
  }
  /*eslint-enable vars-on-top*/
  /*eslint-enable guard-for-in*/

  return clonedObject;
}

function Context(generateLog, oldContext) {
  let context = clone(oldContext);
  context.succeed = data => {
    generateLog(null, () => {
      oldContext.succeed(data);
    });
  };

  context.fail = err => {
    generateLog(err, () => {
      oldContext.fail(err);
    });
  };

  context.done = (err, data) => {
    generateLog(err, () => {
      oldContext.done(err, data);
    });
  };

  context.getRemainingTimeInMillis = oldContext.getRemainingTimeInMillis;

  /* Map getters/setters */
  context.__defineGetter__('callbackWaitsForEmptyEventLoop', () => {
    return oldContext.callbackWaitsForEmptyEventLoop;
  });
  context.__defineSetter__('callbackWaitsForEmptyEventLoop', value => {
    oldContext.callbackWaitsForEmptyEventLoop = value;
  });

  return context;
}

module.exports = Context;
