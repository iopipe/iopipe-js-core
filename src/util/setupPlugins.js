import uniqBy from 'lodash.uniqby';

const defaultPluginFunction = () => {
  return {};
};

export default function setupPlugins(identity, plugins) {
  let pluginCounter = 0;
  return uniqBy(
    plugins.map((pluginFn = defaultPluginFunction) => {
      if (typeof pluginFn === 'function') {
        return pluginFn(identity);
      }
      return {};
    }),
    plugin => {
      return (plugin && plugin.meta && plugin.meta.name) || pluginCounter++;
    }
  );
}
