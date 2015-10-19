goog.provide('ol.source.Zoomify');

goog.require('goog.asserts');
goog.require('ol');
goog.require('ol.ImageTile');
goog.require('ol.TileCoord');
goog.require('ol.TileState');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.source.TileImage');
goog.require('ol.tilegrid.TileGrid');


/**
 * @enum {string}
 */
ol.source.ZoomifyTierSizeCalculation = {
  DEFAULT: 'default',
  TRUNCATED: 'truncated'
};



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
      ol.source.ZoomifyTierSizeCalculation.DEFAULT;

  var imageWidth = size[0];
  var imageHeight = size[1];
  var tierSizeInTiles = [];
  var tileSize = ol.DEFAULT_TILE_SIZE;

  switch (tierSizeCalculation) {
    case ol.source.ZoomifyTierSizeCalculation.DEFAULT:
      while (imageWidth > tileSize || imageHeight > tileSize) {
        tierSizeInTiles.push([
          Math.ceil(imageWidth / tileSize),
          Math.ceil(imageHeight / tileSize)
        ]);
        tileSize += tileSize;
      }
      break;
    case ol.source.ZoomifyTierSizeCalculation.TRUNCATED:
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
      goog.asserts.fail();
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

  goog.base(this, {
    attributions: options.attributions,
    crossOrigin: options.crossOrigin,
    logo: options.logo,
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    tileClass: ol.source.ZoomifyTile_,
    tileGrid: tileGrid,
    tileUrlFunction: tileUrlFunction
  });

};
goog.inherits(ol.source.Zoomify, ol.source.TileImage);



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
  var tileSize = ol.DEFAULT_TILE_SIZE;
  var key = opt_context !== undefined ?
      goog.getUid(opt_context).toString() : '';
  if (key in this.zoomifyImageByContext_) {
    return this.zoomifyImageByContext_[key];
  } else {
    var image = goog.base(this, 'getImage', opt_context);
    if (this.state == ol.TileState.LOADED) {
      if (image.width == tileSize && image.height == tileSize) {
        this.zoomifyImageByContext_[key] = image;
        return image;
      } else {
        var context = ol.dom.createCanvasContext2D(tileSize, tileSize);
        context.drawImage(image, 0, 0);
        this.zoomifyImageByContext_[key] = context.canvas;
        return context.canvas;
      }
    } else {
      return image;
    }
  }
};
