import _ol_ from '../index';
import _ol_TileState_ from '../tilestate';
import _ol_VectorImageTile_ from '../vectorimagetile';
import _ol_VectorTile_ from '../vectortile';
import _ol_size_ from '../size';
import _ol_tilegrid_ from '../tilegrid';
import _ol_source_UrlTile_ from '../source/urltile';

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

  _ol_source_UrlTile_.call(this, {
    attributions: options.attributions,
    cacheSize: options.cacheSize !== undefined ? options.cacheSize : 128,
    extent: extent,
    logo: options.logo,
    opaque: false,
    projection: projection,
    state: options.state,
    tileGrid: tileGrid,
    tileLoadFunction: options.tileLoadFunction ?
      options.tileLoadFunction : _ol_VectorImageTile_.defaultLoadFunction,
    tileUrlFunction: options.tileUrlFunction,
    url: options.url,
    urls: options.urls,
    wrapX: options.wrapX === undefined ? true : options.wrapX
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
  this.tileClass = options.tileClass ? options.tileClass : _ol_VectorTile_;

  /**
   * @private
   * @type {Object.<string,ol.tilegrid.TileGrid>}
   */
  this.tileGrids_ = {};

};

_ol_.inherits(_ol_source_VectorTile_, _ol_source_UrlTile_);


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
  var tileCoordKey = this.getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    return /** @type {!ol.Tile} */ (this.tileCache.get(tileCoordKey));
  } else {
    var tileCoord = [z, x, y];
    var urlTileCoord = this.getTileCoordForTileUrlFunction(
        tileCoord, projection);
    var tileUrl = urlTileCoord ?
      this.tileUrlFunction(urlTileCoord, pixelRatio, projection) : undefined;
    var tile = new _ol_VectorImageTile_(
        tileCoord,
        tileUrl !== undefined ? _ol_TileState_.IDLE : _ol_TileState_.EMPTY,
        tileUrl !== undefined ? tileUrl : '',
        this.format_, this.tileLoadFunction, urlTileCoord, this.tileUrlFunction,
        this.tileGrid, this.getTileGridForProjection(projection),
        this.sourceTiles_, pixelRatio, projection, this.tileClass,
        this.handleTileChange.bind(this));

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
