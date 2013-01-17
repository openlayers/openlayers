goog.provide('ol.renderer.Layer');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.Object');
goog.require('ol.TileRange');
goog.require('ol.layer.Layer');
goog.require('ol.layer.LayerProperty');



/**
 * @constructor
 * @extends {ol.Object}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.Layer} layer Layer.
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
   * @type {ol.layer.Layer}
   */
  this.layer_ = layer;

  goog.events.listen(this.layer_,
      ol.Object.getChangedEventType(ol.layer.LayerProperty.BRIGHTNESS),
      this.handleLayerBrightnessChange, false, this);

  goog.events.listen(this.layer_,
      ol.Object.getChangedEventType(ol.layer.LayerProperty.CONTRAST),
      this.handleLayerContrastChange, false, this);

  goog.events.listen(this.layer_,
      ol.Object.getChangedEventType(ol.layer.LayerProperty.HUE),
      this.handleLayerHueChange, false, this);

  goog.events.listen(this.layer_, goog.events.EventType.LOAD,
      this.handleLayerLoad, false, this);

  goog.events.listen(this.layer_,
      ol.Object.getChangedEventType(ol.layer.LayerProperty.OPACITY),
      this.handleLayerOpacityChange, false, this);

  goog.events.listen(this.layer_,
      ol.Object.getChangedEventType(ol.layer.LayerProperty.SATURATION),
      this.handleLayerSaturationChange, false, this);

  goog.events.listen(this.layer_,
      ol.Object.getChangedEventType(ol.layer.LayerProperty.VISIBLE),
      this.handleLayerVisibleChange, false, this);

};
goog.inherits(ol.renderer.Layer, ol.Object);


/**
 * @return {ol.layer.Layer} Layer.
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


/**
 * @protected
 * @param {Object.<string, Object.<string, ol.TileRange>>} tileUsage Tile usage.
 * @param {ol.source.Source} source Source.
 * @param {number} z Z.
 * @param {ol.TileRange} tileRange Tile range.
 */
ol.renderer.Layer.prototype.updateTileUsage =
    function(tileUsage, source, z, tileRange) {
  // FIXME should we use tilesToDrawByZ instead?
  var sourceKey = goog.getUid(source).toString();
  var zKey = z.toString();
  if (sourceKey in tileUsage) {
    if (z in tileUsage[sourceKey]) {
      tileUsage[sourceKey][zKey].extend(tileRange);
    } else {
      tileUsage[sourceKey][zKey] = tileRange;
    }
  } else {
    tileUsage[sourceKey] = {};
    tileUsage[sourceKey][zKey] = tileRange;
  }
};
