import _ from 'lodash';
import { hooks } from '../hooks';

export const data = [];

class AllHooksPlugin {
  constructor(pluginConfig = {}, invocationInstance) {
    this.invocationInstance = invocationInstance;
    this.config = _.defaults({}, pluginConfig, {
      functionName: 'trace'
    });
    this.hasSetup = false;
    this.hooks = _.chain(hooks)
      .map(hook => {
        return [hook, this.runHook.bind(this, hook)];
      })
      .fromPairs()
      .value();
    return this;
  }
  runHook(hook) {
    const str = `context.hasRun:${hook}`;
    _.set(this.invocationInstance, str, true);
    data.push(str);
  }
}

export function instantiate(pluginOpts) {
  return invocationInstance => {
    return new AllHooksPlugin(pluginOpts, invocationInstance);
  };
}
