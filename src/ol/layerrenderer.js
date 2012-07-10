goog.provide('ol.LayerRenderer');

goog.require('ol.Layer');
goog.require('ol.Object');



/**
 * @constructor
 * @extends {ol.Object}
 * @param {ol.Layer} layer Layer.
 */
ol.LayerRenderer = function(layer) {

  goog.base(this);

  /**
   * @private
   * @type {ol.Layer}
   */
  this.layer_ = layer;

};
goog.inherits(ol.LayerRenderer, ol.Object);


/**
 * @return {ol.Layer} Layer.
 */
ol.LayerRenderer.prototype.getLayer = function() {
  return this.layer_;
};
