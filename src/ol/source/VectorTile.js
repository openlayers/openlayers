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
var _ol_source_VectorTile_ = function(options) {
  var projection = options.projection || 'EPSG:3857';

  var extent = options.extent || _ol_tilegrid_.extentFromProjection(projection);

  var tileGrid = options.tileGrid || _ol_tilegrid_.createXYZ({
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

inherits(_ol_source_VectorTile_, UrlTile);


/**
 * @return {boolean} The source can have overlapping geometries.
 */
_ol_source_VectorTile_.prototype.getOverlaps = function() {
  return this.overlaps_;
};

/**
 * clear {@link ol.TileCache} and delete all source tiles
 * @api
 */
_ol_source_VectorTile_.prototype.clear = function() {
  this.tileCache.clear();
  this.sourceTiles_ = {};
};

/**
 * @inheritDoc
 */
_ol_source_VectorTile_.prototype.getTile = function(z, x, y, pixelRatio, projection) {
  var tileCoordKey = _ol_tilecoord_.getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    return /** @type {!ol.Tile} */ (this.tileCache.get(tileCoordKey));
  } else {
    var tileCoord = [z, x, y];
    var urlTileCoord = this.getTileCoordForTileUrlFunction(
        tileCoord, projection);
    var tile = new VectorImageTile(
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
_ol_source_VectorTile_.prototype.getTileGridForProjection = function(projection) {
  var code = projection.getCode();
  var tileGrid = this.tileGrids_[code];
  if (!tileGrid) {
    // A tile grid that matches the tile size of the source tile grid is more
    // likely to have 1:1 relationships between source tiles and rendered tiles.
    var sourceTileGrid = this.tileGrid;
    tileGrid = this.tileGrids_[code] = _ol_tilegrid_.createForProjection(projection, undefined,
        sourceTileGrid ? sourceTileGrid.getTileSize(sourceTileGrid.getMinZoom()) : undefined);
  }
  return tileGrid;
};


/**
 * @inheritDoc
 */
_ol_source_VectorTile_.prototype.getTilePixelRatio = function(pixelRatio) {
  return pixelRatio;
};


/**
 * @inheritDoc
 */
_ol_source_VectorTile_.prototype.getTilePixelSize = function(z, pixelRatio, projection) {
  var tileSize = _ol_size_.toSize(this.getTileGridForProjection(projection).getTileSize(z));
  return [Math.round(tileSize[0] * pixelRatio), Math.round(tileSize[1] * pixelRatio)];
};
export default _ol_source_VectorTile_;
