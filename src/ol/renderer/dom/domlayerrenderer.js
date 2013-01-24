goog.provide('ol.renderer.dom.Layer');

goog.require('ol.Coordinate');
goog.require('ol.FrameState');
goog.require('ol.layer.Layer');
goog.require('ol.layer.LayerState');
goog.require('ol.renderer.Layer');



/**
 * @constructor
 * @extends {ol.renderer.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.Layer} layer Layer.
 * @param {!Element} target Target.
 */
ol.renderer.dom.Layer = function(mapRenderer, layer, target) {

  goog.base(this, mapRenderer, layer);

  /**
   * @type {!Element}
   * @protected
   */
  this.target = target;

};
goog.inherits(ol.renderer.dom.Layer, ol.renderer.Layer);


/**
 * @inheritDoc
 */
ol.renderer.dom.Layer.prototype.disposeInternal = function() {
  goog.dom.removeNode(this.target);
  goog.base(this, 'disposeInternal');
};


/**
 * @return {!Element} Target.
 */
ol.renderer.dom.Layer.prototype.getTarget = function() {
  return this.target;
};


/**
 * @param {ol.FrameState} frameState Frame state.
 * @param {ol.layer.LayerState} layerState Layer state.
 */
ol.renderer.dom.Layer.prototype.renderFrame = goog.abstractMethod;
