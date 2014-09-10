goog.provide('ol.renderer.Layer');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('ol.ImageState');
goog.require('ol.TileRange');
goog.require('ol.TileState');
goog.require('ol.layer.Layer');
goog.require('ol.layer.LayerState');
goog.require('ol.source.Source');
goog.require('ol.source.State');
goog.require('ol.source.Tile');
goog.require('ol.tilecoord');



/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.Layer} layer Layer.
 * @suppress {checkStructDictInheritance}
 * @struct
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


};
goog.inherits(ol.renderer.Layer, goog.Disposable);


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {olx.FrameState} frameState Frame state.
 * @param {function(this: S, ol.Feature, ol.layer.Layer): T} callback Feature
 *     callback.
 * @param {S} thisArg Value to use as `this` when executing `callback`.
 * @return {T|undefined} Callback result.
 * @template S,T
 */
ol.renderer.Layer.prototype.forEachFeatureAtPixel = goog.nullFunction;


/**
 * @protected
 * @return {ol.layer.Layer} Layer.
 */
ol.renderer.Layer.prototype.getLayer = function() {
  return this.layer_;
};


/**
 * @protected
 * @return {ol.Map} Map.
 */
ol.renderer.Layer.prototype.getMap = function() {
  return this.mapRenderer_.getMap();
};


/**
 * @protected
 * @return {ol.renderer.Map} Map renderer.
 */
ol.renderer.Layer.prototype.getMapRenderer = function() {
  return this.mapRenderer_;
};


/**
 * Handle changes in image state.
 * @param {goog.events.Event} event Image change event.
 * @protected
 */
ol.renderer.Layer.prototype.handleImageChange = function(event) {
  var image = /** @type {ol.Image} */ (event.target);
  if (image.getState() === ol.ImageState.LOADED) {
    this.renderIfReadyAndVisible();
  }
};


/**
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.layer.LayerState} layerState Layer state.
 * @return {boolean} whether composeFrame should be called.
 */
ol.renderer.Layer.prototype.prepareFrame = goog.abstractMethod;


/**
 * @protected
 */
ol.renderer.Layer.prototype.renderIfReadyAndVisible = function() {
  var layer = this.getLayer();
  if (layer.getVisible() && layer.getSourceState() == ol.source.State.READY) {
    this.getMap().render();
  }
};


/**
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.source.Tile} tileSource Tile source.
 * @protected
 */
ol.renderer.Layer.prototype.scheduleExpireCache =
    function(frameState, tileSource) {
  if (tileSource.canExpireCache()) {
    frameState.postRenderFunctions.push(
        goog.partial(
            /**
             * @param {ol.source.Tile} tileSource Tile source.
             * @param {ol.Map} map Map.
             * @param {olx.FrameState} frameState Frame state.
             */
            function(tileSource, map, frameState) {
              var tileSourceKey = goog.getUid(tileSource).toString();
              tileSource.expireCache(frameState.usedTiles[tileSourceKey]);
            }, tileSource));
  }
};


/**
 * @param {Object.<string, ol.Attribution>} attributionsSet Attributions
 *     set (target).
 * @param {Array.<ol.Attribution>} attributions Attributions (source).
 * @protected
 */
ol.renderer.Layer.prototype.updateAttributions =
    function(attributionsSet, attributions) {
  if (goog.isDefAndNotNull(attributions)) {
    var attribution, i, ii;
    for (i = 0, ii = attributions.length; i < ii; ++i) {
      attribution = attributions[i];
      attributionsSet[goog.getUid(attribution).toString()] = attribution;
    }
  }
};


/**
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.source.Source} source Source.
 * @protected
 */
ol.renderer.Layer.prototype.updateLogos = function(frameState, source) {
  var logo = source.getLogo();
  if (goog.isDef(logo)) {
    if (goog.isString(logo)) {
      frameState.logos[logo] = '';
    } else if (goog.isObject(logo)) {
      goog.asserts.assertString(logo.href);
      goog.asserts.assertString(logo.src);
      frameState.logos[logo.src] = logo.href;
    }
  }
};


/**
 * @param {Object.<string, Object.<string, ol.TileRange>>} usedTiles Used tiles.
 * @param {ol.source.Tile} tileSource Tile source.
 * @param {number} z Z.
 * @param {ol.TileRange} tileRange Tile range.
 * @protected
 */
ol.renderer.Layer.prototype.updateUsedTiles =
    function(usedTiles, tileSource, z, tileRange) {
  // FIXME should we use tilesToDrawByZ instead?
  var tileSourceKey = goog.getUid(tileSource).toString();
  var zKey = z.toString();
  if (tileSourceKey in usedTiles) {
    if (zKey in usedTiles[tileSourceKey]) {
      usedTiles[tileSourceKey][zKey].extend(tileRange);
    } else {
      usedTiles[tileSourceKey][zKey] = tileRange;
    }
  } else {
    usedTiles[tileSourceKey] = {};
    usedTiles[tileSourceKey][zKey] = tileRange;
  }
};


/**
 * @param {function(ol.Tile): boolean} isLoadedFunction Function to
 *     determine if the tile is loaded.
 * @param {ol.source.Tile} tileSource Tile source.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.proj.Projection} projection Projection.
 * @protected
 * @return {function(number, number, number): ol.Tile} Returns a tile if it is
 *     loaded.
 */
ol.renderer.Layer.prototype.createGetTileIfLoadedFunction =
    function(isLoadedFunction, tileSource, pixelRatio, projection) {
  return (
      /**
       * @param {number} z Z.
       * @param {number} x X.
       * @param {number} y Y.
       * @return {ol.Tile} Tile.
       */
      function(z, x, y) {
        var tile = tileSource.getTile(z, x, y, pixelRatio, projection);
        return isLoadedFunction(tile) ? tile : null;
      });
};


/**
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {ol.Size} size Size.
 * @protected
 * @return {ol.Coordinate} Snapped center.
 */
ol.renderer.Layer.prototype.snapCenterToPixel =
    function(center, resolution, size) {
  return [
    resolution * (Math.round(center[0] / resolution) + (size[0] % 2) / 2),
    resolution * (Math.round(center[1] / resolution) + (size[1] % 2) / 2)
  ];
};


/**
 * Manage tile pyramid.
 * This function performs a number of functions related to the tiles at the
 * current zoom and lower zoom levels:
 * - registers idle tiles in frameState.wantedTiles so that they are not
 *   discarded by the tile queue
 * - enqueues missing tiles
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.source.Tile} tileSource Tile source.
 * @param {ol.tilegrid.TileGrid} tileGrid Tile grid.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.proj.Projection} projection Projection.
 * @param {ol.Extent} extent Extent.
 * @param {number} currentZ Current Z.
 * @param {number|undefined} preload Load low resolution tiles up to 'preload'
 *     levels.
 * @param {function(this: T, ol.Tile)=} opt_tileCallback Tile callback.
 * @param {T=} opt_this Object to use as `this` in `opt_tileCallback`.
 * @protected
 * @template T
 */
ol.renderer.Layer.prototype.manageTilePyramid = function(
    frameState, tileSource, tileGrid, pixelRatio, projection, extent,
    currentZ, preload, opt_tileCallback, opt_this) {
  var tileSourceKey = goog.getUid(tileSource).toString();
  if (!(tileSourceKey in frameState.wantedTiles)) {
    frameState.wantedTiles[tileSourceKey] = {};
  }
  var wantedTiles = frameState.wantedTiles[tileSourceKey];
  var tileQueue = frameState.tileQueue;
  var minZoom = tileGrid.getMinZoom();
  var tile, tileRange, tileResolution, x, y, z;
  if (!goog.isDef(preload)) {
    preload = 0;
  }
  for (z = currentZ; z >= minZoom; --z) {
    tileRange = tileGrid.getTileRangeForExtentAndZ(extent, z, tileRange);
    tileResolution = tileGrid.getResolution(z);
    for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
        if (currentZ - z <= preload) {
          tile = tileSource.getTile(z, x, y, pixelRatio, projection);
          if (tile.getState() == ol.TileState.IDLE) {
            wantedTiles[ol.tilecoord.toString(tile.tileCoord)] = true;
            if (!tileQueue.isKeyQueued(tile.getKey())) {
              tileQueue.enqueue([tile, tileSourceKey,
                tileGrid.getTileCoordCenter(tile.tileCoord), tileResolution]);
            }
          }
          if (goog.isDef(opt_tileCallback)) {
            opt_tileCallback.call(opt_this, tile);
          }
        } else {
          tileSource.useTile(z, x, y);
        }
      }
    }
  }
};
