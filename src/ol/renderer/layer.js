goog.provide('ol.renderer.Layer');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.Layer');
goog.require('ol.LayerProperty');
goog.require('ol.Object');



/**
 * @constructor
 * @extends {ol.Object}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.Layer} layer Layer.
 */
ol.renderer.Layer = function(mapRenderer, layer) {

  goog.base(this);

  /**
   * @private
   * @type {ol.renderer.Map}
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
goog.inherits(ol.renderer.Layer, ol.Object);


/**
 * @return {ol.Layer} Layer.
 */
ol.renderer.Layer.prototype.getLayer = function() {
  return this.layer_;
};


/**
 * @return {ol.Map} Map.
 */
ol.renderer.Layer.prototype.getMap = function() {
  return this.mapRenderer_.getMap();
};


/**
 * @return {ol.renderer.Map} Map renderer.
 */
ol.renderer.Layer.prototype.getMapRenderer = function() {
  return this.mapRenderer_;
};


/**
 * @protected
 */
ol.renderer.Layer.prototype.handleLayerBrightnessChange = goog.nullFunction;


/**
 * @protected
 */
ol.renderer.Layer.prototype.handleLayerContrastChange = goog.nullFunction;


/**
 * @protected
 */
ol.renderer.Layer.prototype.handleLayerHueChange = goog.nullFunction;


/**
 * @protected
 */
ol.renderer.Layer.prototype.handleLayerLoad = goog.nullFunction;


/**
 * @protected
 */
ol.renderer.Layer.prototype.handleLayerOpacityChange = goog.nullFunction;


/**
 * @protected
 */
ol.renderer.Layer.prototype.handleLayerSaturationChange = goog.nullFunction;


/**
 * @protected
 */
ol.renderer.Layer.prototype.handleLayerVisibleChange = goog.nullFunction;
