export function runHook(plugin, invocationInstance, hook) {
  plugin.hooks[hook].call(null, invocationInstance);
}

export function runAllPluginHooks(invocationInstance, hook) {
  const { plugins = [] } = invocationInstance;
  plugins.forEach(plugin => {
    runHook(plugin, invocationInstance, hook);
  });
}
