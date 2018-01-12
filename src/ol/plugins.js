/**
 * @module ol/plugins
 */
import PluginType from './PluginType.js';

/**
 * The registry of map renderer plugins.
 * @type {Array<olx.MapRendererPlugin>}
 * @private
 */
const mapRendererPlugins = [];


/**
 * Get all registered map renderer plugins.
 * @return {Array<olx.MapRendererPlugin>} The registered map renderer plugins.
 */
export function getMapRendererPlugins() {
  return mapRendererPlugins;
}


/**
 * The registry of layer renderer plugins.
 * @type {Array<olx.LayerRendererPlugin>}
 * @private
 */
const layerRendererPlugins = [];


/**
 * Get all registered layer renderer plugins.
 * @return {Array<olx.LayerRendererPlugin>} The registered layer renderer plugins.
 */
export function getLayerRendererPlugins() {
  return layerRendererPlugins;
}


/**
 * Register a plugin.
 * @param {ol.PluginType} type The plugin type.
 * @param {*} plugin The plugin.
 */
export function register(type, plugin) {
  let plugins;
  switch (type) {
    case PluginType.MAP_RENDERER: {
      plugins = mapRendererPlugins;
      plugins.push(/** @type {olx.MapRendererPlugin} */ (plugin));
      break;
    }
    case PluginType.LAYER_RENDERER: {
      plugins = layerRendererPlugins;
      plugins.push(/** @type {olx.LayerRendererPlugin} */ (plugin));
      break;
    }
    default: {
      throw new Error('Unsupported plugin type: ' + type);
    }
  }
}


/**
 * Register multiple plugins.
 * @param {ol.PluginType} type The plugin type.
 * @param {Array} plugins The plugins.
 */
export function registerMultiple(type, plugins) {
  for (let i = 0, ii = plugins.length; i < ii; ++i) {
    register(type, plugins[i]);
  }
}
