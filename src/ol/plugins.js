goog.provide('ol.plugins');

goog.require('ol.PluginType');

/**
 * The registry of map renderer plugins.
 * @type {Array<olx.MapRendererPlugin>}
 * @private
 */
ol.plugins.mapRendererPlugins_ = [];


/**
 * Get all registered map renderer plugins.
 * @return {Array<olx.MapRendererPlugin>} The registered map renderer plugins.
 */
ol.plugins.getMapRendererPlugins = function() {
  return ol.plugins.mapRendererPlugins_;
};


/**
 * The registry of layer renderer plugins.
 * @type {Array<olx.LayerRendererPlugin>}
 * @private
 */
ol.plugins.layerRendererPlugins_ = [];


/**
 * Get all registered layer renderer plugins.
 * @return {Array<olx.LayerRendererPlugin>} The registered layer renderer plugins.
 */
ol.plugins.getLayerRendererPlugins = function() {
  return ol.plugins.layerRendererPlugins_;
};


/**
 * Register a plugin.
 * @param {ol.PluginType} type The plugin type.
 * @param {*} plugin The plugin.
 */
ol.plugins.register = function(type, plugin) {
  var plugins;
  switch (type) {
    case ol.PluginType.MAP_RENDERER: {
      plugins = ol.plugins.mapRendererPlugins_;
      plugins.push(/** @type {olx.MapRendererPlugin} */ (plugin));
      break;
    }
    case ol.PluginType.LAYER_RENDERER: {
      plugins = ol.plugins.layerRendererPlugins_;
      plugins.push(/** @type {olx.LayerRendererPlugin} */ (plugin));
      break;
    }
    default: {
      throw new Error('Unsupported plugin type: ' + type);
    }
  }
};


/**
 * Register multiple plugins.
 * @param {ol.PluginType} type The plugin type.
 * @param {Array} plugins The plugins.
 */
ol.plugins.registerMultiple = function(type, plugins) {
  for (var i = 0, ii = plugins.length; i < ii; ++i) {
    ol.plugins.register(type, plugins[i]);
  }
};
