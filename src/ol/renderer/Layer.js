/**
 * @module ol/renderer/Layer
 */
import {getUid, inherits} from '../util.js';
import ImageState from '../ImageState.js';
import Observable from '../Observable.js';
import TileState from '../TileState.js';
import {listen} from '../events.js';
import EventType from '../events/EventType.js';
import {FALSE, UNDEFINED} from '../functions.js';
import SourceState from '../source/State.js';

/**
 * @constructor
 * @extends {module:ol/Observable}
 * @param {module:ol/layer/Layer} layer Layer.
 * @struct
 */
const LayerRenderer = function(layer) {

  Observable.call(this);

  /**
   * @private
   * @type {module:ol/layer/Layer}
   */
  this.layer_ = layer;


};

inherits(LayerRenderer, Observable);


/**
 * @param {module:ol/coordinate~Coordinate} coordinate Coordinate.
 * @param {module:ol/PluggableMap~FrameState} frameState Frame state.
 * @param {number} hitTolerance Hit tolerance in pixels.
 * @param {function(this: S, (module:ol/Feature|module:ol/render/Feature), module:ol/layer/Layer): T}
 *     callback Feature callback.
 * @param {S} thisArg Value to use as `this` when executing `callback`.
 * @return {T|undefined} Callback result.
 * @template S,T
 */
LayerRenderer.prototype.forEachFeatureAtCoordinate = UNDEFINED;


/**
 * @param {module:ol/coordinate~Coordinate} coordinate Coordinate.
 * @param {module:ol/PluggableMap~FrameState} frameState Frame state.
 * @return {boolean} Is there a feature at the given coordinate?
 */
LayerRenderer.prototype.hasFeatureAtCoordinate = FALSE;


/**
 * Create a function that adds loaded tiles to the tile lookup.
 * @param {module:ol/source/Tile} source Tile source.
 * @param {module:ol/proj/Projection} projection Projection of the tiles.
 * @param {Object.<number, Object.<string, module:ol/Tile>>} tiles Lookup of loaded tiles by zoom level.
 * @return {function(number, module:ol/TileRange):boolean} A function that can be
 *     called with a zoom level and a tile range to add loaded tiles to the lookup.
 * @protected
 */
LayerRenderer.prototype.createLoadedTileFinder = function(source, projection, tiles) {
  return (
    /**
     * @param {number} zoom Zoom level.
     * @param {module:ol/TileRange} tileRange Tile range.
     * @return {boolean} The tile range is fully loaded.
     */
    function(zoom, tileRange) {
      function callback(tile) {
        if (!tiles[zoom]) {
          tiles[zoom] = {};
        }
        tiles[zoom][tile.tileCoord.toString()] = tile;
      }
      return source.forEachLoadedTile(projection, zoom, tileRange, callback);
    }
  );
};


/**
 * @return {module:ol/layer/Layer} Layer.
 */
LayerRenderer.prototype.getLayer = function() {
  return this.layer_;
};


/**
 * Handle changes in image state.
 * @param {module:ol/events/Event} event Image change event.
 * @private
 */
LayerRenderer.prototype.handleImageChange_ = function(event) {
  const image = /** @type {module:ol/Image} */ (event.target);
  if (image.getState() === ImageState.LOADED) {
    this.renderIfReadyAndVisible();
  }
};


/**
 * Load the image if not already loaded, and register the image change
 * listener if needed.
 * @param {module:ol/ImageBase} image Image.
 * @return {boolean} `true` if the image is already loaded, `false` otherwise.
 * @protected
 */
LayerRenderer.prototype.loadImage = function(image) {
  let imageState = image.getState();
  if (imageState != ImageState.LOADED && imageState != ImageState.ERROR) {
    listen(image, EventType.CHANGE, this.handleImageChange_, this);
  }
  if (imageState == ImageState.IDLE) {
    image.load();
    imageState = image.getState();
  }
  return imageState == ImageState.LOADED;
};


/**
 * @protected
 */
LayerRenderer.prototype.renderIfReadyAndVisible = function() {
  const layer = this.getLayer();
  if (layer.getVisible() && layer.getSourceState() == SourceState.READY) {
    this.changed();
  }
};


/**
 * @param {module:ol/PluggableMap~FrameState} frameState Frame state.
 * @param {module:ol/source/Tile} tileSource Tile source.
 * @protected
 */
LayerRenderer.prototype.scheduleExpireCache = function(frameState, tileSource) {
  if (tileSource.canExpireCache()) {
    /**
     * @param {module:ol/source/Tile} tileSource Tile source.
     * @param {module:ol/PluggableMap} map Map.
     * @param {module:ol/PluggableMap~FrameState} frameState Frame state.
     */
    const postRenderFunction = function(tileSource, map, frameState) {
      const tileSourceKey = getUid(tileSource).toString();
      if (tileSourceKey in frameState.usedTiles) {
        tileSource.expireCache(frameState.viewState.projection,
          frameState.usedTiles[tileSourceKey]);
      }
    }.bind(null, tileSource);

    frameState.postRenderFunctions.push(
      /** @type {module:ol/PluggableMap~PostRenderFunction} */ (postRenderFunction)
    );
  }
};


/**
 * @param {!Object.<string, !Object.<string, module:ol/TileRange>>} usedTiles Used tiles.
 * @param {module:ol/source/Tile} tileSource Tile source.
 * @param {number} z Z.
 * @param {module:ol/TileRange} tileRange Tile range.
 * @protected
 */
LayerRenderer.prototype.updateUsedTiles = function(usedTiles, tileSource, z, tileRange) {
  // FIXME should we use tilesToDrawByZ instead?
  const tileSourceKey = getUid(tileSource).toString();
  const zKey = z.toString();
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
 * Manage tile pyramid.
 * This function performs a number of functions related to the tiles at the
 * current zoom and lower zoom levels:
 * - registers idle tiles in frameState.wantedTiles so that they are not
 *   discarded by the tile queue
 * - enqueues missing tiles
 * @param {module:ol/PluggableMap~FrameState} frameState Frame state.
 * @param {module:ol/source/Tile} tileSource Tile source.
 * @param {module:ol/tilegrid/TileGrid} tileGrid Tile grid.
 * @param {number} pixelRatio Pixel ratio.
 * @param {module:ol/proj/Projection} projection Projection.
 * @param {module:ol/extent~Extent} extent Extent.
 * @param {number} currentZ Current Z.
 * @param {number} preload Load low resolution tiles up to 'preload' levels.
 * @param {function(this: T, module:ol/Tile)=} opt_tileCallback Tile callback.
 * @param {T=} opt_this Object to use as `this` in `opt_tileCallback`.
 * @protected
 * @template T
 */
LayerRenderer.prototype.manageTilePyramid = function(
  frameState, tileSource, tileGrid, pixelRatio, projection, extent,
  currentZ, preload, opt_tileCallback, opt_this) {
  const tileSourceKey = getUid(tileSource).toString();
  if (!(tileSourceKey in frameState.wantedTiles)) {
    frameState.wantedTiles[tileSourceKey] = {};
  }
  const wantedTiles = frameState.wantedTiles[tileSourceKey];
  const tileQueue = frameState.tileQueue;
  const minZoom = tileGrid.getMinZoom();
  let tile, tileRange, tileResolution, x, y, z;
  for (z = minZoom; z <= currentZ; ++z) {
    tileRange = tileGrid.getTileRangeForExtentAndZ(extent, z, tileRange);
    tileResolution = tileGrid.getResolution(z);
    for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
        if (currentZ - z <= preload) {
          tile = tileSource.getTile(z, x, y, pixelRatio, projection);
          if (tile.getState() == TileState.IDLE) {
            wantedTiles[tile.getKey()] = true;
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
export default LayerRenderer;
