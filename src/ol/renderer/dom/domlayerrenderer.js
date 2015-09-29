goog.provide('ol.renderer.dom.Layer');

goog.require('ol');
goog.require('ol.layer.Layer');
goog.require('ol.renderer.Layer');



/**
 * @constructor
 * @extends {ol.renderer.Layer}
 * @param {ol.layer.Layer} layer Layer.
 * @param {!Element} target Target.
 */
ol.renderer.dom.Layer = function(layer, target) {

  goog.base(this, layer);

  /**
   * @type {!Element}
   * @protected
   */
  this.target = target;

};
goog.inherits(ol.renderer.dom.Layer, ol.renderer.Layer);


/**
 * Clear rendered elements.
 */
ol.renderer.dom.Layer.prototype.clearFrame = ol.nullFunction;


/**
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.layer.LayerState} layerState Layer state.
 */
ol.renderer.dom.Layer.prototype.composeFrame = ol.nullFunction;


/**
 * @return {!Element} Target.
 */
ol.renderer.dom.Layer.prototype.getTarget = function() {
  return this.target;
};


/**
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.layer.LayerState} layerState Layer state.
 * @return {boolean} whether composeFrame should be called.
 */
ol.renderer.dom.Layer.prototype.prepareFrame = goog.abstractMethod;
