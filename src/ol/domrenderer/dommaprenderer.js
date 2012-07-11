goog.provide('ol.DOMMapRenderer');

goog.require('ol.Layer');
goog.require('ol.MapRenderer');
goog.require('ol.TileStore');



/**
 * @constructor
 * @extends {ol.MapRenderer}
 * @param {!HTMLDivElement} target Target.
 * @param {Object.<string, *>=} opt_values Values.
 */
ol.DOMMapRenderer = function(target, opt_values) {

  goog.base(this, target);

  // FIXME write initialization code here

  if (goog.isDef(opt_values)) {
    this.setValues(opt_values);
  }

};
goog.inherits(ol.DOMMapRenderer, ol.MapRenderer);


/**
 * @return {boolean} Is supported.
 */
ol.DOMMapRenderer.isSupported = function() {
  return true;
};


/**
 * @inheritDoc
 */
ol.DOMMapRenderer.prototype.createLayerRenderer = function(layer) {
  var store = layer.getStore();
  if (layer instanceof ol.TileStore) {
    // FIXME create DOMTileLayerRenderer
  }
  return null;
};
