import _ from 'lodash';

class MockPlugin {
  constructor(pluginConfig = {}, invocationInstance) {
    this.invocationInstance = invocationInstance;
    this.config = _.defaults({}, pluginConfig, {
      functionName: 'mock'
    });
    this.hasSetup = false;
    this.hooks = {
      'post:setup': this.postSetup.bind(this)
    };
    return this;
  }
  get meta() {
    return {
      name: 'mock',
      version: '0.0.1',
      homepage: 'https://github.com/not/a/real/plugin'
    };
  }
  postSetup() {
    this.hasSetup = true;
    this.invocationInstance.context.iopipe[
      this.config.functionName
    ] = this.mock.bind(this);
    return this.config;
  }
  mock(name, s) {
    const { metrics = [] } = this.invocationInstance;
    metrics.push({
      name: `mock-${name}`,
      s
    });
  }
}

export default function instantiate(pluginOpts) {
  return invocationInstance => {
    return new MockPlugin(pluginOpts, invocationInstance);
  };
}
