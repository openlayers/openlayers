goog.provide('ol.WebGLMapRenderer');

goog.require('ol.Layer');
goog.require('ol.MapRenderer');
goog.require('ol.TileStore');



/**
 * @constructor
 * @extends {ol.MapRenderer}
 * @param {HTMLDivElement} target Target.
 * @param {Object.<string, *>=} opt_values Values.
 */
ol.WebGLMapRenderer = function(target, opt_values) {

  goog.base(this, target);

  if (goog.isDef(opt_values)) {
    this.setValues(opt_values);
  }

};
goog.inherits(ol.WebGLMapRenderer, ol.MapRenderer);


/**
 * @return {boolean} Is supported.
 */
ol.WebGLMapRenderer.isSupported = function() {
  return 'WebGLRenderingContext' in goog.global;
};


/**
 * @inheritDoc
 */
ol.WebGLMapRenderer.prototype.createLayerRenderer = function(layer) {
  var store = layer.getStore();
  if (layer instanceof ol.TileStore) {
    // FIXME create WebGLTileLayerRenderer
  }
  return null;
};
