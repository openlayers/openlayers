goog.provide('ol.LayerRenderer');

goog.require('goog.events');
goog.require('ol.Layer');
goog.require('ol.LayerProperty');
goog.require('ol.Object');



/**
 * @constructor
 * @extends {ol.Object}
 * @param {ol.Map} map Map.
 * @param {ol.Layer} layer Layer.
 */
ol.LayerRenderer = function(map, layer) {

  goog.base(this);

  /**
   * @private
   * @type {ol.Map}
   */
  this.map_ = map;

  /**
   * @private
   * @type {ol.Layer}
   */
  this.layer_ = layer;

  goog.events.listen(this.layer_,
      ol.Object.getChangedEventType(ol.LayerProperty.HUE),
      this.handleLayerHueChange, false, this);

  goog.events.listen(this.layer_,
      ol.Object.getChangedEventType(ol.LayerProperty.OPACITY),
      this.handleLayerOpacityChange, false, this);

  goog.events.listen(this.layer_,
      ol.Object.getChangedEventType(ol.LayerProperty.SATURATION),
      this.handleLayerSaturationChange, false, this);

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
 * @return {ol.Map} Map.
 */
ol.LayerRenderer.prototype.getMap = function() {
  return this.map_;
};


/**
 * @protected
 */
ol.LayerRenderer.prototype.handleLayerHueChange = goog.nullFunction;


/**
 * @protected
 */
ol.LayerRenderer.prototype.handleLayerOpacityChange = goog.nullFunction;


/**
 * @protected
 */
ol.LayerRenderer.prototype.handleLayerSaturationChange = goog.nullFunction;


/**
 * @protected
 */
ol.LayerRenderer.prototype.handleLayerVisibleChange = goog.nullFunction;
