goog.provide('ol.dom.LayerRenderer');

goog.require('ol.LayerRenderer');



/**
 * @constructor
 * @extends {ol.LayerRenderer}
 * @param {ol.dom.Map} map Map.
 * @param {ol.Layer} layer Layer.
 * @param {!Element} target Target.
 */
ol.dom.LayerRenderer = function(map, layer, target) {
  goog.base(this, map, layer);

  /**
   * @type {!Element}
   * @protected
   */
  this.target = target;

  /**
   * Top left corner of the target in map coords.
   *
   * @type {goog.math.Coordinate}
   * @protected
   */
  this.origin = null;

};
goog.inherits(ol.dom.LayerRenderer, ol.LayerRenderer);


/**
 * @override
 * @return {ol.dom.Map} Map.
 */
ol.dom.LayerRenderer.prototype.getMap = function() {
  return /** @type {ol.dom.Map} */ (goog.base(this, 'getMap'));
};


/**
 * Set the location of the top left corner of the target.
 *
 * @param {goog.math.Coordinate} origin Origin.
 */
ol.dom.LayerRenderer.prototype.setOrigin = function(origin) {
  this.origin = origin;
};


/**
 * @inheritDoc
 */
ol.dom.LayerRenderer.prototype.handleLayerOpacityChange = function() {
  goog.style.setOpacity(this.target, this.layer_.getOpacity());
};


/**
 * @inheritDoc
 */
ol.dom.LayerRenderer.prototype.handleLayerVisibleChange = function() {
  goog.style.showElement(this.target, this.layer_.getVisible());
};


/**
 */
ol.dom.LayerRenderer.prototype.redraw = goog.abstractMethod;
