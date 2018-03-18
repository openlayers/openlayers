/**
 * @module ol/plugins
 */
import PluginType from './PluginType.js';


/**
 * @typedef {Object} MapRendererPlugin
 * @property {function(module:ol/renderer/Type):boolean} handles Determine if
 * this renderer handles the provided layer.
 * @property {function(Element, module:ol/PluggableMap~PluggableMap):module:ol/renderer/Map~Map} create
 * Create the map renderer.
 */


/**
 * @typedef {Object} LayerRendererPlugin
 * @property {function(module:ol/renderer/Type, module:ol/layer/Layer~Layer):boolean} handles
 * Determine if this renderer handles the provided layer.
 * @property {function(module:ol/renderer/Map~Map, module:ol/layer/Layer~Layer):module:ol/renderer/Layer~Layer} create
 * Create a layer renderer.
 */


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
 * @param {module:ol/PluginType~PluginType} type The plugin type.
 * @param {*} plugin The plugin.
 */
export function register(type, plugin) {
  let plugins;
  switch (type) {
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
 * @param {module:ol/PluginType~PluginType} type The plugin type.
 * @param {Array} plugins The plugins.
 */
export function registerMultiple(type, plugins) {
  for (let i = 0, ii = plugins.length; i < ii; ++i) {
    register(type, plugins[i]);
  }
}
