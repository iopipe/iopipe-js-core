import _ from 'lodash';

class TracePlugin {
  constructor(pluginConfig = {}, invocationInstance) {
    this.invocationInstance = invocationInstance;
    this.config = _.defaults({}, pluginConfig, {
      functionName: 'trace'
    });
    this.hasSetup = false;
    this.hooks = {
      'post:setup': this.postSetup.bind(this)
    };
    return this;
  }
  postSetup() {
    this.hasSetup = true;
    this.invocationInstance.context.iopipe[
      this.config.functionName
    ] = this.trace.bind(this);
    return this.config;
  }
  trace(name, s) {
    const { metrics = [] } = this.invocationInstance;
    metrics.push({
      name: `trace-${name}`,
      s
    });
  }
}

export default function instantiate(pluginOpts) {
  return invocationInstance => {
    return new TracePlugin(pluginOpts, invocationInstance);
  };
}
