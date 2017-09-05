import _ol_PluginType_ from './plugintype';
var _ol_plugins_ = {};

/**
 * The registry of map renderer plugins.
 * @type {Array<olx.MapRendererPlugin>}
 * @private
 */
_ol_plugins_.mapRendererPlugins_ = [];


/**
 * Get all registered map renderer plugins.
 * @return {Array<olx.MapRendererPlugin>} The registered map renderer plugins.
 */
_ol_plugins_.getMapRendererPlugins = function() {
  return _ol_plugins_.mapRendererPlugins_;
};


/**
 * The registry of layer renderer plugins.
 * @type {Array<olx.LayerRendererPlugin>}
 * @private
 */
_ol_plugins_.layerRendererPlugins_ = [];


/**
 * Get all registered layer renderer plugins.
 * @return {Array<olx.LayerRendererPlugin>} The registered layer renderer plugins.
 */
_ol_plugins_.getLayerRendererPlugins = function() {
  return _ol_plugins_.layerRendererPlugins_;
};


/**
 * Register a plugin.
 * @param {ol.PluginType} type The plugin type.
 * @param {*} plugin The plugin.
 */
_ol_plugins_.register = function(type, plugin) {
  var plugins;
  switch (type) {
    case _ol_PluginType_.MAP_RENDERER: {
      plugins = _ol_plugins_.mapRendererPlugins_;
      plugins.push(/** @type {olx.MapRendererPlugin} */ (plugin));
      break;
    }
    case _ol_PluginType_.LAYER_RENDERER: {
      plugins = _ol_plugins_.layerRendererPlugins_;
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
_ol_plugins_.registerMultiple = function(type, plugins) {
  for (var i = 0, ii = plugins.length; i < ii; ++i) {
    _ol_plugins_.register(type, plugins[i]);
  }
};
export default _ol_plugins_;
