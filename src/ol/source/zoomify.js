goog.provide('ol.source.Zoomify');

goog.require('ol');
goog.require('ol.ImageTile');
goog.require('ol.Tile');
goog.require('ol.asserts');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.source.TileImage');
goog.require('ol.tilegrid.TileGrid');


/**
 * @classdesc
 * Layer source for tile data in Zoomify format.
 *
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.ZoomifyOptions=} opt_options Options.
 * @api stable
 */
ol.source.Zoomify = function(opt_options) {

  var options = opt_options || {};

  var size = options.size;
  var tierSizeCalculation = options.tierSizeCalculation !== undefined ?
      options.tierSizeCalculation :
      ol.source.Zoomify.TierSizeCalculation.DEFAULT;

  var imageWidth = size[0];
  var imageHeight = size[1];
  var tierSizeInTiles = [];
  var tileSize = ol.DEFAULT_TILE_SIZE;

  switch (tierSizeCalculation) {
    case ol.source.Zoomify.TierSizeCalculation.DEFAULT:
      while (imageWidth > tileSize || imageHeight > tileSize) {
        tierSizeInTiles.push([
          Math.ceil(imageWidth / tileSize),
          Math.ceil(imageHeight / tileSize)
        ]);
        tileSize += tileSize;
      }
      break;
    case ol.source.Zoomify.TierSizeCalculation.TRUNCATED:
      var width = imageWidth;
      var height = imageHeight;
      while (width > tileSize || height > tileSize) {
        tierSizeInTiles.push([
          Math.ceil(width / tileSize),
          Math.ceil(height / tileSize)
        ]);
        width >>= 1;
        height >>= 1;
      }
      break;
    default:
      ol.asserts.assert(false, 53); // Unknown `tierSizeCalculation` configured
      break;
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
      var tileCoordZ = tileCoord[0];
      var tileCoordX = tileCoord[1];
      var tileCoordY = -tileCoord[2] - 1;
      var tileIndex =
          tileCoordX +
          tileCoordY * tierSizeInTiles[tileCoordZ][0] +
          tileCountUpToTier[tileCoordZ];
      var tileGroup = (tileIndex / ol.DEFAULT_TILE_SIZE) | 0;
      return url + 'TileGroup' + tileGroup + '/' +
          tileCoordZ + '-' + tileCoordX + '-' + tileCoordY + '.jpg';
    }
  }

  ol.source.TileImage.call(this, {
    attributions: options.attributions,
    cacheSize: options.cacheSize,
    crossOrigin: options.crossOrigin,
    logo: options.logo,
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    tileClass: ol.source.Zoomify.Tile_,
    tileGrid: tileGrid,
    tileUrlFunction: tileUrlFunction
  });

};
ol.inherits(ol.source.Zoomify, ol.source.TileImage);


/**
 * @constructor
 * @extends {ol.ImageTile}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.Tile.State} state State.
 * @param {string} src Image source URI.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
 * @private
 */
ol.source.Zoomify.Tile_ = function(
    tileCoord, state, src, crossOrigin, tileLoadFunction) {

  ol.ImageTile.call(this, tileCoord, state, src, crossOrigin, tileLoadFunction);

  /**
   * @private
   * @type {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement}
   */
  this.zoomifyImage_ = null;

};
ol.inherits(ol.source.Zoomify.Tile_, ol.ImageTile);


/**
 * @inheritDoc
 */
ol.source.Zoomify.Tile_.prototype.getImage = function() {
  if (this.zoomifyImage_) {
    return this.zoomifyImage_;
  }
  var tileSize = ol.DEFAULT_TILE_SIZE;
  var image = ol.ImageTile.prototype.getImage.call(this);
  if (this.state == ol.Tile.State.LOADED) {
    if (image.width == tileSize && image.height == tileSize) {
      this.zoomifyImage_ = image;
      return image;
    } else {
      var context = ol.dom.createCanvasContext2D(tileSize, tileSize);
      context.drawImage(image, 0, 0);
      this.zoomifyImage_ = context.canvas;
      return context.canvas;
    }
  } else {
    return image;
  }
};


/**
 * @enum {string}
 */
ol.source.Zoomify.TierSizeCalculation = {
  DEFAULT: 'default',
  TRUNCATED: 'truncated'
};
