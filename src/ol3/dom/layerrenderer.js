goog.provide('ol3.dom.LayerRenderer');

goog.require('ol3.Coordinate');
goog.require('ol3.LayerRenderer');



/**
 * @constructor
 * @extends {ol3.LayerRenderer}
 * @param {ol3.MapRenderer} mapRenderer Map renderer.
 * @param {ol3.Layer} layer Layer.
 * @param {!Element} target Target.
 */
ol3.dom.LayerRenderer = function(mapRenderer, layer, target) {
  goog.base(this, mapRenderer, layer);

  /**
   * @type {!Element}
   * @protected
   */
  this.target = target;

  /**
   * Top left corner of the target in map coords.
   *
   * @type {ol3.Coordinate}
   * @protected
   */
  this.origin = null;

  this.handleLayerOpacityChange();
  this.handleLayerVisibleChange();

};
goog.inherits(ol3.dom.LayerRenderer, ol3.LayerRenderer);


/**
 * @override
 * @return {ol3.MapRenderer} Map renderer.
 */
ol3.dom.LayerRenderer.prototype.getMapRenderer = function() {
  return /** @type {ol3.dom.MapRenderer} */ goog.base(this, 'getMapRenderer');
};


/**
 * @inheritDoc
 */
ol3.dom.LayerRenderer.prototype.handleLayerLoad = function() {
  this.getMap().render();
};


/**
 * @inheritDoc
 */
ol3.dom.LayerRenderer.prototype.handleLayerOpacityChange = function() {
  goog.style.setOpacity(this.target, this.getLayer().getOpacity());
};


/**
 * @inheritDoc
 */
ol3.dom.LayerRenderer.prototype.handleLayerVisibleChange = function() {
  goog.style.showElement(this.target, this.getLayer().getVisible());
};


/**
 */
ol3.dom.LayerRenderer.prototype.render = goog.abstractMethod;


/**
 * Set the location of the top left corner of the target.
 *
 * @param {ol3.Coordinate} origin Origin.
 */
ol3.dom.LayerRenderer.prototype.setOrigin = function(origin) {
  this.origin = origin;
};
