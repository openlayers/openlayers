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
   * Location of the top-left corner of the renderer container in map coords.
   *
   * @type {goog.math.Coordinate}
   * @protected
   */
  this.containerOrigin = null;

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
 * Set the location of the top-left corner of the renderer container.
 *
 * @param {goog.math.Coordinate} origin The container origin.
 */
ol.dom.LayerRenderer.prototype.setContainerOrigin = function(origin) {
  this.containerOrigin = origin;
};


/**
 */
ol.dom.LayerRenderer.prototype.redraw = goog.abstractMethod;
