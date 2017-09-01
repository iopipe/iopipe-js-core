import _ from 'lodash';
import { hooks } from '../hooks';

export const data = [];

class AllHooksPlugin {
  constructor(pluginConfig = {}, invocationInstance) {
    this.invocationInstance = invocationInstance;
    this.config = _.defaults({}, pluginConfig, {
      functionName: 'allHooks'
    });
    this.hasSetup = false;
    this.hooks = _.chain(hooks)
      .map(hook => {
        return [hook, this.runHook.bind(this, hook)];
      })
      .fromPairs()
      .value();
    this.meta = {
      name: 'allHooks',
      version: '0.0.1',
      homepage: 'https://github.com/not/a/real/plugin'
    };
    return this;
  }
  meta() {
    return {
      name: 'allHooks',
      version: '0.0.1',
      homepage: 'https://github.com/not/a/real/plugin'
    };
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
