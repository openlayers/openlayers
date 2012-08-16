goog.provide('ol.LayerRenderer');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.Layer');
goog.require('ol.LayerProperty');
goog.require('ol.Object');



/**
 * @constructor
 * @extends {ol.Object}
 * @param {ol.MapRenderer} mapRenderer Map renderer.
 * @param {ol.Layer} layer Layer.
 */
ol.LayerRenderer = function(mapRenderer, layer) {

  goog.base(this);

  /**
   * @private
   * @type {ol.MapRenderer}
   */
  this.mapRenderer_ = mapRenderer;

  /**
   * @private
   * @type {ol.Layer}
   */
  this.layer_ = layer;

  goog.events.listen(this.layer_,
      ol.Object.getChangedEventType(ol.LayerProperty.BRIGHTNESS),
      this.handleLayerBrightnessChange, false, this);

  goog.events.listen(this.layer_,
      ol.Object.getChangedEventType(ol.LayerProperty.CONTRAST),
      this.handleLayerContrastChange, false, this);

  goog.events.listen(this.layer_,
      ol.Object.getChangedEventType(ol.LayerProperty.HUE),
      this.handleLayerHueChange, false, this);

  goog.events.listen(this.layer_, goog.events.EventType.LOAD,
      this.handleLayerLoad, false, this);

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
  return this.mapRenderer_.getMap();
};


/**
 * @return {ol.MapRenderer} Map renderer.
 */
ol.LayerRenderer.prototype.getMapRenderer = function() {
  return this.mapRenderer_;
};


/**
 * @protected
 */
ol.LayerRenderer.prototype.handleLayerBrightnessChange = goog.nullFunction;


/**
 * @protected
 */
ol.LayerRenderer.prototype.handleLayerContrastChange = goog.nullFunction;


/**
 * @protected
 */
ol.LayerRenderer.prototype.handleLayerHueChange = goog.nullFunction;


/**
 * @protected
 */
ol.LayerRenderer.prototype.handleLayerLoad = goog.nullFunction;


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
