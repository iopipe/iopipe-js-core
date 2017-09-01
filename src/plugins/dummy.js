import _ from 'lodash';

class DummyPlugin {
  constructor(pluginConfig = {}, invocationInstance) {
    this.invocationInstance = invocationInstance;
    this.config = _.defaults({}, pluginConfig, {
      functionName: 'dummy'
    });
    this.hasSetup = false;
    this.hooks = {
      'post:setup': this.postSetup.bind(this)
    };
    return this;
  }
  meta() {
    return {
      name: 'dummy',
      version: '0.0.1',
      homepage: 'https://github.com/not/a/real/plugin'
    };
  }
  postSetup() {
    this.hasSetup = true;
    this.invocationInstance.context.iopipe[
      this.config.functionName
    ] = this.dummy.bind(this);
    return this.config;
  }
  dummy(name, s) {
    const { metrics = [] } = this.invocationInstance;
    metrics.push({
      name: `dummy-${name}`,
      s
    });
  }
}

export default function instantiate(pluginOpts) {
  return invocationInstance => {
    return new DummyPlugin(pluginOpts, invocationInstance);
  };
}
