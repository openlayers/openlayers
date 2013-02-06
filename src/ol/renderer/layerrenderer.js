goog.provide('ol.renderer.Layer');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.FrameState');
goog.require('ol.Object');
goog.require('ol.Tile');
goog.require('ol.TileCoord');
goog.require('ol.TileRange');
goog.require('ol.TileState');
goog.require('ol.layer.Layer');
goog.require('ol.layer.LayerProperty');
goog.require('ol.layer.LayerState');
goog.require('ol.source.Source');
goog.require('ol.source.TileSource');



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
 * @protected
 */
ol.renderer.Layer.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


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
ol.renderer.Layer.prototype.handleLayerLoad = function() {
  this.dispatchChangeEvent();
};


/**
 * @protected
 */
ol.renderer.Layer.prototype.handleLayerOpacityChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @protected
 */
ol.renderer.Layer.prototype.handleLayerSaturationChange = goog.nullFunction;


/**
 * @protected
 */
ol.renderer.Layer.prototype.handleLayerVisibleChange = function() {
  this.dispatchChangeEvent();
};


/**
 * Handle changes in tile state.
 * @param {goog.events.Event} event Tile change event.
 * @protected
 */
ol.renderer.Layer.prototype.handleTileChange = function(event) {
  var tile = /** @type {ol.Tile} */ (event.target);
  if (tile.getState() === ol.TileState.LOADED) {
    this.getMap().requestRenderFrame();
  }
};


/**
 * @param {ol.FrameState} frameState Frame state.
 * @param {ol.layer.LayerState} layerState Layer state.
 */
ol.renderer.Layer.prototype.renderFrame = goog.abstractMethod;


/**
 * @protected
 * @param {ol.FrameState} frameState Frame state.
 * @param {ol.source.TileSource} tileSource Tile source.
 */
ol.renderer.Layer.prototype.scheduleExpireCache =
    function(frameState, tileSource) {
  if (tileSource.canExpireCache()) {
    frameState.postRenderFunctions.push(
        goog.partial(function(tileSource, map, frameState) {
          var tileSourceKey = goog.getUid(tileSource).toString();
          tileSource.expireCache(frameState.usedTiles[tileSourceKey]);
        }, tileSource));
  }
};


/**
 * @protected
 * @param {Object.<string, Object.<string, ol.TileRange>>} usedTiles Used tiles.
 * @param {ol.source.Source} source Source.
 * @param {number} z Z.
 * @param {ol.TileRange} tileRange Tile range.
 */
ol.renderer.Layer.prototype.updateUsedTiles =
    function(usedTiles, source, z, tileRange) {
  // FIXME should we use tilesToDrawByZ instead?
  var sourceKey = goog.getUid(source).toString();
  var zKey = z.toString();
  if (sourceKey in usedTiles) {
    if (zKey in usedTiles[sourceKey]) {
      usedTiles[sourceKey][zKey].extend(tileRange);
    } else {
      usedTiles[sourceKey][zKey] = tileRange;
    }
  } else {
    usedTiles[sourceKey] = {};
    usedTiles[sourceKey][zKey] = tileRange;
  }
};


/**
 * @protected
 * @param {Object.<string, Object.<string, boolean>>} wantedTiles Wanted tiles.
 * @param {ol.source.Source} source Source.
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 */
ol.renderer.Layer.prototype.updateWantedTiles =
    function(wantedTiles, source, tileCoord) {
  var sourceKey = goog.getUid(source).toString();
  var coordKey = tileCoord.toString();
  if (!(sourceKey in wantedTiles)) {
    wantedTiles[sourceKey] = {};
  }
  wantedTiles[sourceKey][coordKey] = true;
};
