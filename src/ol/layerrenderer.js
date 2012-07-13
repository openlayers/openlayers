goog.provide('ol.LayerRenderer');

goog.require('goog.events');
goog.require('ol.Layer');
goog.require('ol.LayerProperty');
goog.require('ol.Object');



/**
 * @constructor
 * @extends {ol.Object}
 * @param {ol.Layer} layer Layer.
 */
ol.LayerRenderer = function(layer) {

  goog.base(this);

  /**
   * @private
   * @type {ol.Layer}
   */
  this.layer_ = layer;

  goog.events.listen(this.layer_,
      ol.Object.getChangedEventType(ol.LayerProperty.OPACITY),
      this.handleLayerOpacityChange, false, this);

  goog.events.listen(this.layer_,
      ol.Object.getChangedEventType(ol.LayerProperty.VISIBLE),
      this.handleLayerVisibleChange, false, this);

};
goog.inherits(ol.LayerRenderer, ol.Object);


/**
 * @return {ol.Layer} Layer.
 */
ol.LayerRenderer.prototype.getLayer = function() {
  return this.layer_;
};


/**
 * @protected
 */
ol.LayerRenderer.prototype.handleLayerOpacityChange = goog.nullFunction;


/**
 * @protected
 */
ol.LayerRenderer.prototype.handleLayerVisibleChange = goog.nullFunction;
