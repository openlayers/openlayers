goog.provide('ol.source.DebugTileSource');
goog.provide('ol.source.DebugTileSourceOptions');

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

  var tileSize = tileGrid.getTileSize();

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = /** @type {HTMLCanvasElement} */
      (goog.dom.createElement(goog.dom.TagName.CANVAS));
  this.canvas_.width = tileSize.width;
  this.canvas_.height = tileSize.height;

  var context = this.canvas_.getContext('2d');

  context.strokeStyle = 'black';
  context.strokeRect(0.5, 0.5, tileSize.width + 0.5, tileSize.height + 0.5);

  context.fillStyle = 'black';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '24px sans-serif';
  context.fillText(
      tileCoord.toString(), tileSize.width / 2, tileSize.height / 2);

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
  if (goog.isDef(opt_context)) {
    var canvas;
    var key = goog.getUid(opt_context);
    if (key in this.canvasByContext_) {
      return this.canvasByContext_[key];
    } else if (goog.object.isEmpty(this.canvasByContext_)) {
      canvas = this.canvas_;
    } else {
      canvas = /** @type {HTMLCanvasElement} */ (this.canvas_.cloneNode(false));
    }
    this.canvasByContext_[key] = canvas;
    return canvas;
  } else {
    return this.canvas_;
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
