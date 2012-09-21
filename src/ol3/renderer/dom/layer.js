goog.provide('ol3.renderer.dom.Layer');

goog.require('ol3.Coordinate');
goog.require('ol3.renderer.Layer');



/**
 * @constructor
 * @extends {ol3.renderer.Layer}
 * @param {ol3.renderer.Map} mapRenderer Map renderer.
 * @param {ol3.Layer} layer Layer.
 * @param {!Element} target Target.
 */
ol3.renderer.dom.Layer = function(mapRenderer, layer, target) {
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
goog.inherits(ol3.renderer.dom.Layer, ol3.renderer.Layer);


/**
 * @override
 * @return {ol3.renderer.Map} Map renderer.
 */
ol3.renderer.dom.Layer.prototype.getMapRenderer = function() {
  return /** @type {ol3.renderer.dom.Map} */ goog.base(this, 'getMapRenderer');
};


/**
 * @inheritDoc
 */
ol3.renderer.dom.Layer.prototype.handleLayerLoad = function() {
  this.getMap().render();
};


/**
 * @inheritDoc
 */
ol3.renderer.dom.Layer.prototype.handleLayerOpacityChange = function() {
  goog.style.setOpacity(this.target, this.getLayer().getOpacity());
};


/**
 * @inheritDoc
 */
ol3.renderer.dom.Layer.prototype.handleLayerVisibleChange = function() {
  goog.style.showElement(this.target, this.getLayer().getVisible());
};


/**
 * Render.
 */
ol3.renderer.dom.Layer.prototype.render = goog.abstractMethod;


/**
 * Set the location of the top left corner of the target.
 *
 * @param {ol3.Coordinate} origin Origin.
 */
ol3.renderer.dom.Layer.prototype.setOrigin = function(origin) {
  this.origin = origin;
};
