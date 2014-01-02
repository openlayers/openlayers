goog.provide('ol.source.Zoomify');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('ol.ImageTile');
goog.require('ol.TileCoord');
goog.require('ol.TileState');
goog.require('ol.TileUrlFunction');
goog.require('ol.proj');
goog.require('ol.source.TileImage');
goog.require('ol.tilegrid.Zoomify');



/**
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.ZoomifyOptions=} opt_options Options.
 * @todo stability experimental
 */
ol.source.Zoomify = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var size = options.size;
  var imageWidth = size[0];
  var imageHeight = size[1];

  var tierSizeInTiles = [];
  var tileSize = ol.DEFAULT_TILE_SIZE;
  while (imageWidth > tileSize || imageHeight > tileSize) {
    tierSizeInTiles.push([
      Math.ceil(imageWidth / tileSize),
      Math.ceil(imageHeight / tileSize)
    ]);
    tileSize += tileSize;
  }
  tierSizeInTiles.push([1, 1]);
  tierSizeInTiles.reverse();

  var resolutions = [1];
  var tileCountUpToTier = [0];
  var i, ii;
  for (i = 1, ii = tierSizeInTiles.length; i < ii; i++) {
    resolutions.push(1 << i);
    tileCountUpToTier.push(
        tierSizeInTiles[i - 1][0] * tierSizeInTiles[i - 1][1] +
        tileCountUpToTier[i - 1]
    );
  }
  resolutions.reverse();

  var tileGrid = new ol.tilegrid.Zoomify({
    resolutions: resolutions
  });

  var url = options.url;
  var tileUrlFunction = ol.TileUrlFunction.withTileCoordTransform(
      tileGrid.createTileCoordTransform({extent: [0, 0, size[0], size[1]]}),
      /**
       * @this {ol.source.TileImage}
       * @param {ol.TileCoord} tileCoord Tile Coordinate.
       * @param {ol.proj.Projection} projection Projection.
       * @return {string|undefined} Tile URL.
       */
      function(tileCoord, projection) {
        if (goog.isNull(tileCoord)) {
          return undefined;
        } else {
          var tileIndex = tileCoord.x +
              tileCoord.y * tierSizeInTiles[tileCoord.z][0] +
              tileCountUpToTier[tileCoord.z];
          var tileGroup = (tileIndex / ol.DEFAULT_TILE_SIZE) | 0;
          return url + 'TileGroup' + tileGroup + '/' +
              tileCoord.z + '-' + tileCoord.x + '-' + tileCoord.y + '.jpg';
        }
      });

  goog.base(this, {
    attributions: options.attributions,
    crossOrigin: options.crossOrigin,
    logo: options.logo,
    tileGrid: tileGrid,
    tileUrlFunction: tileUrlFunction
  });

};
goog.inherits(ol.source.Zoomify, ol.source.TileImage);


/**
 * @inheritDoc
 */
ol.source.Zoomify.prototype.getTile = function(z, x, y, projection) {
  var tileCoordKey = this.getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    return /** @type {!ol.source.ZoomifyTile_} */ (
        this.tileCache.get(tileCoordKey));
  } else {
    goog.asserts.assert(goog.isDef(projection));
    var tileCoord = new ol.TileCoord(z, x, y);
    var tileUrl = this.tileUrlFunction(tileCoord, projection);
    var tile = new ol.source.ZoomifyTile_(
        tileCoord,
        goog.isDef(tileUrl) ? ol.TileState.IDLE : ol.TileState.EMPTY,
        goog.isDef(tileUrl) ? tileUrl : '',
        this.crossOrigin,
        this.tileLoadFunction);
    this.tileCache.set(tileCoordKey, tile);
    return tile;
  }
};



/**
 * @constructor
 * @extends {ol.ImageTile}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.TileState} state State.
 * @param {string} src Image source URI.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
 * @private
 */
ol.source.ZoomifyTile_ = function(
    tileCoord, state, src, crossOrigin, tileLoadFunction) {

  goog.base(this, tileCoord, state, src, crossOrigin, tileLoadFunction);

  /**
   * @private
   * @type {Object.<string,
   *                HTMLCanvasElement|HTMLImageElement|HTMLVideoElement>}
   */
  this.zoomifyImageByContext_ = {};

};
goog.inherits(ol.source.ZoomifyTile_, ol.ImageTile);


/**
 * @inheritDoc
 */
ol.source.ZoomifyTile_.prototype.getImage = function(opt_context) {
  var key = goog.isDef(opt_context) ? goog.getUid(opt_context).toString() : '';
  if (key in this.zoomifyImageByContext_) {
    return this.zoomifyImageByContext_[key];
  } else {
    var image = goog.base(this, 'getImage', opt_context);
    if (this.state == ol.TileState.LOADED) {
      if (image.width == ol.DEFAULT_TILE_SIZE &&
          image.height == ol.DEFAULT_TILE_SIZE) {
        this.zoomifyImageByContext_[key] = image;
        return image;
      } else {
        var canvas = /** @type {HTMLCanvasElement} */
            (goog.dom.createElement(goog.dom.TagName.CANVAS));
        canvas.width = ol.DEFAULT_TILE_SIZE;
        canvas.height = ol.DEFAULT_TILE_SIZE;
        var context = /** @type {CanvasRenderingContext2D} */
            (canvas.getContext('2d'));
        context.drawImage(image, 0, 0);
        this.zoomifyImageByContext_[key] = canvas;
        return canvas;
      }
    } else {
      return image;
    }
  }
};
