goog.provide('ol.dom.LayerRenderer');

goog.require('ol.Coordinate');
goog.require('ol.LayerRenderer');



/**
 * @constructor
 * @extends {ol.LayerRenderer}
 * @param {ol.MapRenderer} mapRenderer Map renderer.
 * @param {ol.Layer} layer Layer.
 * @param {!Element} target Target.
 */
ol.dom.LayerRenderer = function(mapRenderer, layer, target) {
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
goog.inherits(ol.dom.LayerRenderer, ol.LayerRenderer);


/**
 * @override
 * @return {ol.MapRenderer} Map renderer.
 */
ol.dom.LayerRenderer.prototype.getMapRenderer = function() {
  return /** @type {ol.dom.MapRenderer} */ goog.base(this, 'getMapRenderer');
};


/**
 * @inheritDoc
 */
ol.dom.LayerRenderer.prototype.handleLayerOpacityChange = function() {
  goog.style.setOpacity(this.target, this.getLayer().getOpacity());
};


/**
 * @inheritDoc
 */
ol.dom.LayerRenderer.prototype.handleLayerVisibleChange = function() {
  goog.style.showElement(this.target, this.getLayer().getVisible());
};


/**
 */
ol.dom.LayerRenderer.prototype.render = goog.abstractMethod;


/**
 * Set the location of the top left corner of the target.
 *
 * @param {ol.Coordinate} origin Origin.
 */
ol.dom.LayerRenderer.prototype.setOrigin = function(origin) {
  this.origin = origin;
};
