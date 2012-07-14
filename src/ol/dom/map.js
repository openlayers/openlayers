goog.provide('ol.dom.Map');

goog.require('ol.Layer');
goog.require('ol.Map');
goog.require('ol.TileStore');



/**
 * @constructor
 * @extends {ol.Map}
 * @param {!HTMLDivElement} target Target.
 * @param {Object.<string, *>=} opt_values Values.
 */
ol.dom.Map = function(target, opt_values) {

  goog.base(this, target);

  // FIXME write initialization code here

  if (goog.isDef(opt_values)) {
    this.setValues(opt_values);
  }

};
goog.inherits(ol.dom.Map, ol.Map);


/**
 * @inheritDoc
 */
ol.dom.Map.prototype.createLayerRenderer = function(layer) {
  var store = layer.getStore();
  if (layer instanceof ol.TileStore) {
    // FIXME create ol.dom.TileLayerRenderer
  }
  return null;
};
