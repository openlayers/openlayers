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
 */
ol.dom.LayerRenderer.prototype.redraw = goog.abstractMethod;
