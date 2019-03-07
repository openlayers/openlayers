/**
 * @module ol/renderer/Layer
 */
import {getUid, abstract} from '../util.js';
import ImageState from '../ImageState.js';
import Observable from '../Observable.js';
import TileState from '../TileState.js';
import {listen} from '../events.js';
import EventType from '../events/EventType.js';
import SourceState from '../source/State.js';

class LayerRenderer extends Observable {

  /**
   * @param {import("../layer/Layer.js").default} layer Layer.
   */
  constructor(layer) {

    super();

    /**
     * @private
     * @type {import("../layer/Layer.js").default}
     */
    this.layer_ = layer;

  }

  /**
   * Determine whether render should be called.
   * @abstract
   * @param {import("../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../layer/Layer.js").State} layerState Layer state.
   * @return {boolean} Layer is ready to be rendered.
   */
  prepareFrame(frameState, layerState) {
    return abstract();
  }

  /**
   * Render the layer.
   * @abstract
   * @param {import("../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../layer/Layer.js").State} layerState Layer state.
   * @return {HTMLElement} The rendered element.
   */
  renderFrame(frameState, layerState) {
    return abstract();
  }

  /**
   * @param {Object<number, Object<string, import("../Tile.js").default>>} tiles Lookup of loaded tiles by zoom level.
   * @param {number} zoom Zoom level.
   * @param {import("../Tile.js").default} tile Tile.
   */
  loadedTileCallback(tiles, zoom, tile) {
    if (!tiles[zoom]) {
      tiles[zoom] = {};
    }
    tiles[zoom][tile.tileCoord.toString()] = tile;
  }

  /**
   * Create a function that adds loaded tiles to the tile lookup.
   * @param {import("../source/Tile.js").default} source Tile source.
   * @param {import("../proj/Projection.js").default} projection Projection of the tiles.
   * @param {Object<number, Object<string, import("../Tile.js").default>>} tiles Lookup of loaded tiles by zoom level.
   * @return {function(number, import("../TileRange.js").default):boolean} A function that can be
   *     called with a zoom level and a tile range to add loaded tiles to the lookup.
   * @protected
   */
  createLoadedTileFinder(source, projection, tiles) {
    return (
      /**
       * @param {number} zoom Zoom level.
       * @param {import("../TileRange.js").default} tileRange Tile range.
       * @return {boolean} The tile range is fully loaded.
       * @this {LayerRenderer}
       */
      function(zoom, tileRange) {
        const callback = this.loadedTileCallback.bind(this, tiles, zoom);
        return source.forEachLoadedTile(projection, zoom, tileRange, callback);
      }
    ).bind(this);
  }

  /**
   * @abstract
   * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {import("../PluggableMap.js").FrameState} frameState Frame state.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @param {function(import("../Feature.js").FeatureLike, import("../layer/Layer.js").default): T} callback Feature callback.
   * @return {T|void} Callback result.
   * @template T
   */
  forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, callback) {}

  /**
   * @abstract
   * @param {import("../pixel.js").Pixel} pixel Pixel.
   * @param {import("../PluggableMap.js").FrameState} frameState FrameState.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @return {Uint8ClampedArray|Uint8Array} The result.  If there is no data at the pixel
   *    location, null will be returned.  If there is data, but pixel values cannot be
   *    returned, and empty array will be returned.
   */
  getDataAtPixel(pixel, frameState, hitTolerance) {
    return abstract();
  }

  /**
   * @return {import("../layer/Layer.js").default} Layer.
   */
  getLayer() {
    return this.layer_;
  }

  /**
   * Handle changes in image state.
   * @param {import("../events/Event.js").default} event Image change event.
   * @private
   */
  handleImageChange_(event) {
    const image = /** @type {import("../Image.js").default} */ (event.target);
    if (image.getState() === ImageState.LOADED) {
      this.renderIfReadyAndVisible();
    }
  }

  /**
   * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {import("../PluggableMap.js").FrameState} frameState Frame state.
   * @return {boolean} Is there a feature at the given coordinate?
   */
  hasFeatureAtCoordinate(coordinate, frameState) {
    return false;
  }

  /**
   * Load the image if not already loaded, and register the image change
   * listener if needed.
   * @param {import("../ImageBase.js").default} image Image.
   * @return {boolean} `true` if the image is already loaded, `false` otherwise.
   * @protected
   */
  loadImage(image) {
    let imageState = image.getState();
    if (imageState != ImageState.LOADED && imageState != ImageState.ERROR) {
      listen(image, EventType.CHANGE, this.handleImageChange_, this);
    }
    if (imageState == ImageState.IDLE) {
      image.load();
      imageState = image.getState();
    }
    return imageState == ImageState.LOADED;
  }

  /**
   * @protected
   */
  renderIfReadyAndVisible() {
    const layer = this.getLayer();
    if (layer.getVisible() && layer.getSourceState() == SourceState.READY) {
      layer.changed();
    }
  }

  /**
   * @param {import("../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../source/Tile.js").default} tileSource Tile source.
   * @protected
   */
  scheduleExpireCache(frameState, tileSource) {
    if (tileSource.canExpireCache()) {
      /**
       * @param {import("../source/Tile.js").default} tileSource Tile source.
       * @param {import("../PluggableMap.js").default} map Map.
       * @param {import("../PluggableMap.js").FrameState} frameState Frame state.
       */
      const postRenderFunction = function(tileSource, map, frameState) {
        const tileSourceKey = getUid(tileSource);
        if (tileSourceKey in frameState.usedTiles) {
          tileSource.expireCache(frameState.viewState.projection,
            frameState.usedTiles[tileSourceKey]);
        }
      }.bind(null, tileSource);

      frameState.postRenderFunctions.push(
        /** @type {import("../PluggableMap.js").PostRenderFunction} */ (postRenderFunction)
      );
    }
  }

  /**
   * @param {!Object<string, !Object<string, boolean>>} usedTiles Used tiles.
   * @param {import("../source/Tile.js").default} tileSource Tile source.
   * @param {import('../Tile.js').default} tile Tile.
   * @protected
   */
  updateUsedTiles(usedTiles, tileSource, tile) {
    // FIXME should we use tilesToDrawByZ instead?
    const tileSourceKey = getUid(tileSource);
    if (!(tileSourceKey in usedTiles)) {
      usedTiles[tileSourceKey] = {};
    }
    usedTiles[tileSourceKey][tile.getKey()] = true;
  }

  /**
   * Manage tile pyramid.
   * This function performs a number of functions related to the tiles at the
   * current zoom and lower zoom levels:
   * - registers idle tiles in frameState.wantedTiles so that they are not
   *   discarded by the tile queue
   * - enqueues missing tiles
   * @param {import("../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../source/Tile.js").default} tileSource Tile source.
   * @param {import("../tilegrid/TileGrid.js").default} tileGrid Tile grid.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {number} currentZ Current Z.
   * @param {number} preload Load low resolution tiles up to 'preload' levels.
   * @param {function(import("../Tile.js").default)=} opt_tileCallback Tile callback.
   * @protected
   */
  manageTilePyramid(
    frameState,
    tileSource,
    tileGrid,
    pixelRatio,
    projection,
    extent,
    currentZ,
    preload,
    opt_tileCallback
  ) {
    const tileSourceKey = getUid(tileSource);
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
              opt_tileCallback(tile);
            }
          } else {
            tileSource.useTile(z, x, y, projection);
          }
        }
      }
    }
  }
}

export default LayerRenderer;
