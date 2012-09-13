goog.provide('ol3.renderer.Layer');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol3.Layer');
goog.require('ol3.LayerProperty');
goog.require('ol3.Object');



/**
 * @constructor
 * @extends {ol3.Object}
 * @param {ol3.renderer.Map} mapRenderer Map renderer.
 * @param {ol3.Layer} layer Layer.
 */
ol3.renderer.Layer = function(mapRenderer, layer) {

  goog.base(this);

  /**
   * @private
   * @type {ol3.renderer.Map}
   */
  this.mapRenderer_ = mapRenderer;

  /**
   * @private
   * @type {ol3.Layer}
   */
  this.layer_ = layer;

  goog.events.listen(this.layer_,
      ol3.Object.getChangedEventType(ol3.LayerProperty.BRIGHTNESS),
      this.handleLayerBrightnessChange, false, this);

  goog.events.listen(this.layer_,
      ol3.Object.getChangedEventType(ol3.LayerProperty.CONTRAST),
      this.handleLayerContrastChange, false, this);

  goog.events.listen(this.layer_,
      ol3.Object.getChangedEventType(ol3.LayerProperty.HUE),
      this.handleLayerHueChange, false, this);

  goog.events.listen(this.layer_, goog.events.EventType.LOAD,
      this.handleLayerLoad, false, this);

  goog.events.listen(this.layer_,
      ol3.Object.getChangedEventType(ol3.LayerProperty.OPACITY),
      this.handleLayerOpacityChange, false, this);

  goog.events.listen(this.layer_,
      ol3.Object.getChangedEventType(ol3.LayerProperty.SATURATION),
      this.handleLayerSaturationChange, false, this);

  goog.events.listen(this.layer_,
      ol3.Object.getChangedEventType(ol3.LayerProperty.VISIBLE),
      this.handleLayerVisibleChange, false, this);

};
goog.inherits(ol3.renderer.Layer, ol3.Object);


/**
 * @return {ol3.Layer} Layer.
 */
ol3.renderer.Layer.prototype.getLayer = function() {
  return this.layer_;
};


/**
 * @return {ol3.Map} Map.
 */
ol3.renderer.Layer.prototype.getMap = function() {
  return this.mapRenderer_.getMap();
};


/**
 * @return {ol3.renderer.Map} Map renderer.
 */
ol3.renderer.Layer.prototype.getMapRenderer = function() {
  return this.mapRenderer_;
};


/**
 * @protected
 */
ol3.renderer.Layer.prototype.handleLayerBrightnessChange = goog.nullFunction;


/**
 * @protected
 */
ol3.renderer.Layer.prototype.handleLayerContrastChange = goog.nullFunction;


/**
 * @protected
 */
ol3.renderer.Layer.prototype.handleLayerHueChange = goog.nullFunction;


/**
 * @protected
 */
ol3.renderer.Layer.prototype.handleLayerLoad = goog.nullFunction;


/**
 * @protected
 */
ol3.renderer.Layer.prototype.handleLayerOpacityChange = goog.nullFunction;


/**
 * @protected
 */
ol3.renderer.Layer.prototype.handleLayerSaturationChange = goog.nullFunction;


/**
 * @protected
 */
ol3.renderer.Layer.prototype.handleLayerVisibleChange = goog.nullFunction;
