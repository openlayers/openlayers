goog.provide('ol.renderer.canvas.VectorLayer2');

goog.require('ol.renderer.canvas.Layer');



/**
 * @constructor
 * @extends {ol.renderer.canvas.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.VectorLayer2} vectorLayer2 Vector layer.
 */
ol.renderer.canvas.VectorLayer2 = function(mapRenderer, vectorLayer2) {

  goog.base(this, mapRenderer, vectorLayer2);

};
goog.inherits(ol.renderer.canvas.VectorLayer2, ol.renderer.canvas.Layer);


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorLayer2.prototype.getImage = function() {
  return null; // FIXME
};


/**
 * @return {ol.layer.VectorLayer2} Vector layer.
 */
ol.renderer.canvas.VectorLayer2.prototype.getVectorLayer = function() {
  return /** @type {ol.layer.VectorLayer2} */ (this.getLayer());
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorLayer2.prototype.renderFrame =
    function(frameState, layerState) {
  // FIXME
};
