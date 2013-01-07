goog.provide('ol.renderer.dom.Layer');

goog.require('ol.Coordinate');
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

  /**
   * Top left corner of the target in map coords.
   *
   * @type {ol.Coordinate}
   * @protected
   */
  this.origin = null;

  this.handleLayerOpacityChange();
  this.handleLayerVisibleChange();

};
goog.inherits(ol.renderer.dom.Layer, ol.renderer.Layer);


/**
 * @inheritDoc
 * @return {ol.renderer.Map} Map renderer.
 */
ol.renderer.dom.Layer.prototype.getMapRenderer = function() {
  return /** @type {ol.renderer.dom.Map} */ (goog.base(this, 'getMapRenderer'));
};


/**
 * @inheritDoc
 */
ol.renderer.dom.Layer.prototype.handleLayerLoad = function() {
  this.getMap().render();
};


/**
 * @inheritDoc
 */
ol.renderer.dom.Layer.prototype.handleLayerOpacityChange = function() {
  goog.style.setOpacity(this.target, this.getLayer().getOpacity());
};


/**
 * @inheritDoc
 */
ol.renderer.dom.Layer.prototype.handleLayerVisibleChange = function() {
  goog.style.showElement(this.target, this.getLayer().getVisible());
};


/**
 * Render.
 * @param {number} time Time.
 */
ol.renderer.dom.Layer.prototype.renderFrame = goog.abstractMethod;


/**
 * Set the location of the top left corner of the target.
 *
 * @param {ol.Coordinate} origin Origin.
 */
ol.renderer.dom.Layer.prototype.setOrigin = function(origin) {
  this.origin = origin;
};
