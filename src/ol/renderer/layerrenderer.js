goog.provide('ol.renderer.Layer');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.functions');
goog.require('ol');
goog.require('ol.ImageState');
goog.require('ol.Observable');
goog.require('ol.TileRange');
goog.require('ol.TileState');
goog.require('ol.layer.Layer');
goog.require('ol.source.Source');
goog.require('ol.source.State');
goog.require('ol.source.Tile');
goog.require('ol.tilecoord');
goog.require('ol.vec.Mat4');



/**
 * @constructor
 * @extends {ol.Observable}
 * @param {ol.layer.Layer} layer Layer.
 * @struct
 */
ol.renderer.Layer = function(layer) {

  goog.base(this);

  /**
   * @private
   * @type {ol.layer.Layer}
   */
  this.layer_ = layer;


};
goog.inherits(ol.renderer.Layer, ol.Observable);


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {olx.FrameState} frameState Frame state.
 * @param {function(this: S, ol.Feature, ol.layer.Layer): T} callback Feature
 *     callback.
 * @param {S} thisArg Value to use as `this` when executing `callback`.
 * @return {T|undefined} Callback result.
 * @template S,T
 */
ol.renderer.Layer.prototype.forEachFeatureAtCoordinate = ol.nullFunction;


/**
 * @param {ol.Pixel} pixel Pixel.
 * @param {olx.FrameState} frameState Frame state.
 * @param {function(this: S, ol.layer.Layer): T} callback Layer callback.
 * @param {S} thisArg Value to use as `this` when executing `callback`.
 * @return {T|undefined} Callback result.
 * @template S,T
 */
ol.renderer.Layer.prototype.forEachLayerAtPixel =
    function(pixel, frameState, callback, thisArg) {
  var coordinate = pixel.slice();
  ol.vec.Mat4.multVec2(
      frameState.pixelToCoordinateMatrix, coordinate, coordinate);

  var hasFeature = this.forEachFeatureAtCoordinate(
      coordinate, frameState, goog.functions.TRUE, this);

  if (hasFeature) {
    return callback.call(thisArg, this.layer_);
  } else {
    return undefined;
  }
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {olx.FrameState} frameState Frame state.
 * @return {boolean} Is there a feature at the given coordinate?
 */
ol.renderer.Layer.prototype.hasFeatureAtCoordinate = goog.functions.FALSE;


/**
 * Create a function that adds loaded tiles to the tile lookup.
 * @param {ol.source.Tile} source Tile source.
 * @param {ol.proj.Projection} projection Projection of the tiles.
 * @param {Object.<number, Object.<string, ol.Tile>>} tiles Lookup of loaded
 *     tiles by zoom level.
 * @return {function(number, ol.TileRange):boolean} A function that can be
 *     called with a zoom level and a tile range to add loaded tiles to the
 *     lookup.
 * @protected
 */
ol.renderer.Layer.prototype.createLoadedTileFinder =
    function(source, projection, tiles) {
  return (
      /**
       * @param {number} zoom Zoom level.
       * @param {ol.TileRange} tileRange Tile range.
       * @return {boolean} The tile range is fully loaded.
       */
      function(zoom, tileRange) {
        return source.forEachLoadedTile(projection, zoom,
                                        tileRange, function(tile) {
              if (!tiles[zoom]) {
                tiles[zoom] = {};
              }
              tiles[zoom][tile.tileCoord.toString()] = tile;
            });
      });
};


/**
 * @return {ol.layer.Layer} Layer.
 */
ol.renderer.Layer.prototype.getLayer = function() {
  return this.layer_;
};


/**
 * Handle changes in image state.
 * @param {goog.events.Event} event Image change event.
 * @private
 */
ol.renderer.Layer.prototype.handleImageChange_ = function(event) {
  var image = /** @type {ol.Image} */ (event.target);
  if (image.getState() === ol.ImageState.LOADED) {
    this.renderIfReadyAndVisible();
  }
};


/**
 * Load the image if not already loaded, and register the image change
 * listener if needed.
 * @param {ol.ImageBase} image Image.
 * @return {boolean} `true` if the image is already loaded, `false`
 *     otherwise.
 * @protected
 */
ol.renderer.Layer.prototype.loadImage = function(image) {
  var imageState = image.getState();
  if (imageState != ol.ImageState.LOADED &&
      imageState != ol.ImageState.ERROR) {
    // the image is either "idle" or "loading", register the change
    // listener (a noop if the listener was already registered)
    goog.asserts.assert(imageState == ol.ImageState.IDLE ||
        imageState == ol.ImageState.LOADING,
        'imageState is "idle" or "loading"');
    goog.events.listen(image, goog.events.EventType.CHANGE,
        this.handleImageChange_, false, this);
  }
  if (imageState == ol.ImageState.IDLE) {
    image.load();
    imageState = image.getState();
    goog.asserts.assert(imageState == ol.ImageState.LOADING ||
        imageState == ol.ImageState.LOADED,
        'imageState is "loading" or "loaded"');
  }
  return imageState == ol.ImageState.LOADED;
};


/**
 * @protected
 */
ol.renderer.Layer.prototype.renderIfReadyAndVisible = function() {
  var layer = this.getLayer();
  if (layer.getVisible() && layer.getSourceState() == ol.source.State.READY) {
    this.changed();
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
              tileSource.expireCache(frameState.viewState.projection,
                                     frameState.usedTiles[tileSourceKey]);
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
  if (attributions) {
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
  if (logo !== undefined) {
    if (goog.isString(logo)) {
      frameState.logos[logo] = '';
    } else if (goog.isObject(logo)) {
      goog.asserts.assertString(logo.href, 'logo.href is a string');
      goog.asserts.assertString(logo.src, 'logo.src is a string');
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
 * @param {number} preload Load low resolution tiles up to 'preload' levels.
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
          if (opt_tileCallback !== undefined) {
            opt_tileCallback.call(opt_this, tile);
          }
        } else {
          tileSource.useTile(z, x, y, projection);
        }
      }
    }
  }
};
