class TestPlugin {
  constructor(pluginConfig, invocationInstance) {
    this.invocationInstance = invocationInstance;
    this.config = pluginConfig;
    this.hasSetup = false;
    this.hooks = {
      'post:setup': this.postSetup.bind(this)
    };
    return this;
  }
  postSetup() {
    this.hasSetup = true;
    this.invocationInstance.context.iopipe.trace = this.trace.bind(this);
    this.debug(JSON.stringify(this.config));
    return this.config;
  }
  trace(name, s) {
    const { metrics = [] } = this.invocationInstance;
    metrics.push({
      name,
      s
    });
  }
  debug(...args) {
    if (this.config.debug) {
      console.log('woot', args);
    }
  }
}

export default function instantiate(pluginOpts) {
  return function Plugin(invocationInstance) {
    return new TestPlugin(pluginOpts, invocationInstance);
  };
}
