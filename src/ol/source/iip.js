goog.provide('ol.source.IIP');

goog.require('ol');
goog.require('ol.ImageTile');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.source.TileImage');
goog.require('ol.tilegrid.TileGrid');


/**
 * @classdesc
 * Layer source for tile data in IIP format.
 *
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.IIPOptions=} opt_options Options.
 * @api stable
 */
ol.source.IIP = function(opt_options) {

  var options = opt_options || {};

  var size = options.size;
  var nbResolutions = options.nbResolutions;
  var tileSize = options.tileSize;

  var imageWidth = size[0];
  var imageHeight = size[1];
  var tierSizeInTiles = [];

  var i;

  if (!tileSize) {
    tileSize = ol.DEFAULT_TILE_SIZE;
  }
  var resolutions = [1];
  if (!nbResolutions) {
    var tierSizeMax = Math.max(Math.ceil(imageWidth / tileSize), Math.ceil(imageHeight / tileSize));
    while (Math.pow(2, resolutions.length - 1) < tierSizeMax) {
      resolutions.push(resolutions[resolutions.length - 1] * 2);
    }
  } else {
    for (i = 1; i < nbResolutions; i++) {
      resolutions.push(resolutions[i - 1] * 2);
    }
  }

  for (i = 0; i < resolutions.length; i++) {
    tierSizeInTiles.push([
      Math.ceil((imageWidth / tileSize) / resolutions[i]),
      Math.ceil((imageHeight / tileSize) / resolutions[i])
    ]);
  }

  tierSizeInTiles.reverse();
  resolutions.reverse();

  var extent = [0, -size[1], size[0], 0];
  var tileGrid = new ol.tilegrid.TileGrid({
    extent: extent,
    origin: ol.extent.getTopLeft(extent),
    resolutions: resolutions
  });

  var url = options.url;


  /**
   * @this {ol.source.TileImage}
   * @param {ol.TileCoord} tileCoord Tile Coordinate.
   * @param {number} pixelRatio Pixel ratio.
   * @param {ol.proj.Projection} projection Projection.
   * @return {string|undefined} Tile URL.
   */
  function tileUrlFunction(tileCoord, pixelRatio, projection) {
    if (!tileCoord) {
      return undefined;
    } else {
      var resolution = tileCoord[0];
      var tileCoordX = tileCoord[1];
      var tileCoordY = -tileCoord[2] - 1;
      var tileIndex = tileCoordX + tileCoordY * tierSizeInTiles[resolution][0];
      return url + '&WID=' + tileSize + '&JTL=' + resolution + ',' +
          tileIndex;
    }
  }

  ol.source.TileImage.call(this, {
    attributions: options.attributions,
    cacheSize: options.cacheSize,
    crossOrigin: options.crossOrigin,
    logo: options.logo,
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    tileClass: ol.source.IIP.Tile_,
    tileGrid: tileGrid,
    tileUrlFunction: tileUrlFunction
  });

};
ol.inherits(ol.source.IIP, ol.source.TileImage);


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
ol.source.IIP.Tile_ = function(
    tileCoord, state, src, crossOrigin, tileLoadFunction) {

  ol.ImageTile.call(this, tileCoord, state, src, crossOrigin, tileLoadFunction);

  /**
   * @private
   * @type {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement}
   */
  this.iipImage_ = null;

};
ol.inherits(ol.source.IIP.Tile_, ol.ImageTile);


/**
 * @inheritDoc
 */
ol.source.IIP.Tile_.prototype.getImage = function() {
  if (this.iipImage_) {
    return this.iipImage_;
  }
  var tileSize = ol.DEFAULT_TILE_SIZE;
  var image = ol.ImageTile.prototype.getImage.call(this);
  if (this.state == ol.TileState.LOADED) {
    if (image.width == tileSize && image.height == tileSize) {
      this.iipImage_ = image;
      return image;
    } else {
      var context = ol.dom.createCanvasContext2D(tileSize, tileSize);
      context.drawImage(image, 0, 0);
      this.iipImage_ = context.canvas;
      return context.canvas;
    }
  } else {
    return image;
  }
};
