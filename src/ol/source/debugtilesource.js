goog.provide('ol.source.DebugTileSource');
goog.provide('ol.source.DebugTileSourceOptions');

goog.require('ol.Size');
goog.require('ol.Tile');
goog.require('ol.TileCoord');
goog.require('ol.source.TileSource');
goog.require('ol.tilegrid.TileGrid');



/**
 * @constructor
 * @extends {ol.Tile}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.tilegrid.TileGrid} tileGrid Tile grid.
 * @private
 */
ol.DebugTile_ = function(tileCoord, tileGrid) {

  goog.base(this, tileCoord);

  this.state = ol.TileState.LOADED;

  /**
   * @private
   * @type {ol.TileCoord}
   */
  this.tileCoord_ = tileCoord;

  /**
   * @private
   * @type {ol.Size}
   */
  this.tileSize_ = tileGrid.getTileSize();

  /**
   * @private
   * @type {Object.<number, HTMLCanvasElement>}
   */
  this.canvasByContext_ = {};

};
goog.inherits(ol.DebugTile_, ol.Tile);


/**
 * @inheritDoc
 */
ol.DebugTile_.prototype.getImage = function(opt_context) {
  var key = goog.isDef(opt_context) ? goog.getUid(opt_context) : -1;
  if (key in this.canvasByContext_) {
    return this.canvasByContext_[key];
  } else {

    var tileSize = this.tileSize_;

    var canvas = /** @type {HTMLCanvasElement} */
        (goog.dom.createElement(goog.dom.TagName.CANVAS));
    canvas.width = tileSize.width;
    canvas.height = tileSize.height;

    var context = canvas.getContext('2d');

    context.strokeStyle = 'black';
    context.strokeRect(0.5, 0.5, tileSize.width + 0.5, tileSize.height + 0.5);

    context.fillStyle = 'black';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '24px sans-serif';
    context.fillText(
        this.tileCoord_.toString(), tileSize.width / 2, tileSize.height / 2);

    this.canvasByContext_[key] = canvas;
    return canvas;

  }
};


/**
 * @typedef {{extent: (ol.Extent|undefined),
 *            projection: (ol.Projection|undefined),
 *            tileGrid: (ol.tilegrid.TileGrid|undefined)}}
 */
ol.source.DebugTileSourceOptions;



/**
 * @constructor
 * @extends {ol.source.TileSource}
 * @param {ol.source.DebugTileSourceOptions} options Options.
 */
ol.source.DebugTileSource = function(options) {

  goog.base(this, {
    extent: options.extent,
    projection: options.projection,
    tileGrid: options.tileGrid
  });

  /**
   * @private
   * @type {Object.<string, ol.DebugTile_>}
   * FIXME will need to expire elements from this cache
   * FIXME see elemoine's work with goog.structs.LinkedMap
   */
  this.tileCache_ = {};

};
goog.inherits(ol.source.DebugTileSource, ol.source.TileSource);


/**
 * @inheritDoc
 */
ol.source.DebugTileSource.prototype.getTile = function(tileCoord) {
  var key = tileCoord.toString();
  if (goog.object.containsKey(this.tileCache_, key)) {
    return this.tileCache_[key];
  } else {
    var tile = new ol.DebugTile_(tileCoord, this.tileGrid);
    this.tileCache_[key] = tile;
    return tile;
  }
};
