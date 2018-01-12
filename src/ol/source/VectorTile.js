/**
 * @module ol/source/VectorTile
 */
import {inherits} from '../index.js';
import TileState from '../TileState.js';
import VectorImageTile, {defaultLoadFunction} from '../VectorImageTile.js';
import VectorTile from '../VectorTile.js';
import _ol_size_ from '../size.js';
import UrlTile from '../source/UrlTile.js';
import _ol_tilecoord_ from '../tilecoord.js';
import _ol_tilegrid_ from '../tilegrid.js';

/**
 * @classdesc
 * Class for layer sources providing vector data divided into a tile grid, to be
 * used with {@link ol.layer.VectorTile}. Although this source receives tiles
 * with vector features from the server, it is not meant for feature editing.
 * Features are optimized for rendering, their geometries are clipped at or near
 * tile boundaries and simplified for a view resolution. See
 * {@link ol.source.Vector} for vector sources that are suitable for feature
 * editing.
 *
 * @constructor
 * @fires ol.source.Tile.Event
 * @extends {ol.source.UrlTile}
 * @param {olx.source.VectorTileOptions} options Vector tile options.
 * @api
 */
const VectorTileSource = function(options) {
  const projection = options.projection || 'EPSG:3857';

  const extent = options.extent || _ol_tilegrid_.extentFromProjection(projection);

  const tileGrid = options.tileGrid || _ol_tilegrid_.createXYZ({
    extent: extent,
    maxZoom: options.maxZoom || 22,
    minZoom: options.minZoom,
    tileSize: options.tileSize || 512
  });

  UrlTile.call(this, {
    attributions: options.attributions,
    cacheSize: options.cacheSize !== undefined ? options.cacheSize : 128,
    extent: extent,
    opaque: false,
    projection: projection,
    state: options.state,
    tileGrid: tileGrid,
    tileLoadFunction: options.tileLoadFunction ? options.tileLoadFunction : defaultLoadFunction,
    tileUrlFunction: options.tileUrlFunction,
    url: options.url,
    urls: options.urls,
    wrapX: options.wrapX === undefined ? true : options.wrapX,
    transition: options.transition
  });

  /**
   * @private
   * @type {ol.format.Feature}
   */
  this.format_ = options.format ? options.format : null;

  /**
   * @private
   * @type {Object.<string,ol.VectorTile>}
   */
  this.sourceTiles_ = {};

  /**
   * @private
   * @type {boolean}
   */
  this.overlaps_ = options.overlaps == undefined ? true : options.overlaps;

  /**
   * @protected
   * @type {function(new: ol.VectorTile, ol.TileCoord, ol.TileState, string,
   *        ol.format.Feature, ol.TileLoadFunctionType)}
   */
  this.tileClass = options.tileClass ? options.tileClass : VectorTile;

  /**
   * @private
   * @type {Object.<string,ol.tilegrid.TileGrid>}
   */
  this.tileGrids_ = {};

};

inherits(VectorTileSource, UrlTile);


/**
 * @return {boolean} The source can have overlapping geometries.
 */
VectorTileSource.prototype.getOverlaps = function() {
  return this.overlaps_;
};

/**
 * clear {@link ol.TileCache} and delete all source tiles
 * @api
 */
VectorTileSource.prototype.clear = function() {
  this.tileCache.clear();
  this.sourceTiles_ = {};
};

/**
 * @inheritDoc
 */
VectorTileSource.prototype.getTile = function(z, x, y, pixelRatio, projection) {
  const tileCoordKey = _ol_tilecoord_.getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    return /** @type {!ol.Tile} */ (this.tileCache.get(tileCoordKey));
  } else {
    const tileCoord = [z, x, y];
    const urlTileCoord = this.getTileCoordForTileUrlFunction(
      tileCoord, projection);
    const tile = new VectorImageTile(
      tileCoord,
      urlTileCoord !== null ? TileState.IDLE : TileState.EMPTY,
      this.getRevision(),
      this.format_, this.tileLoadFunction, urlTileCoord, this.tileUrlFunction,
      this.tileGrid, this.getTileGridForProjection(projection),
      this.sourceTiles_, pixelRatio, projection, this.tileClass,
      this.handleTileChange.bind(this),
      this.tileOptions);

    this.tileCache.set(tileCoordKey, tile);
    return tile;
  }
};


/**
 * @inheritDoc
 */
VectorTileSource.prototype.getTileGridForProjection = function(projection) {
  const code = projection.getCode();
  let tileGrid = this.tileGrids_[code];
  if (!tileGrid) {
    // A tile grid that matches the tile size of the source tile grid is more
    // likely to have 1:1 relationships between source tiles and rendered tiles.
    const sourceTileGrid = this.tileGrid;
    tileGrid = this.tileGrids_[code] = _ol_tilegrid_.createForProjection(projection, undefined,
      sourceTileGrid ? sourceTileGrid.getTileSize(sourceTileGrid.getMinZoom()) : undefined);
  }
  return tileGrid;
};


/**
 * @inheritDoc
 */
VectorTileSource.prototype.getTilePixelRatio = function(pixelRatio) {
  return pixelRatio;
};


/**
 * @inheritDoc
 */
VectorTileSource.prototype.getTilePixelSize = function(z, pixelRatio, projection) {
  const tileSize = _ol_size_.toSize(this.getTileGridForProjection(projection).getTileSize(z));
  return [Math.round(tileSize[0] * pixelRatio), Math.round(tileSize[1] * pixelRatio)];
};
export default VectorTileSource;
