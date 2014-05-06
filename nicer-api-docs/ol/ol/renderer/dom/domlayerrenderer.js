goog.provide('ol.renderer.dom.Layer');

goog.require('goog.dom');
goog.require('ol.layer.Layer');
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
 * @return {!Element} Target.
 */
ol.renderer.dom.Layer.prototype.getTarget = function() {
  return this.target;
};
