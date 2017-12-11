goog.provide('ol.source.Zoomify');

goog.require('ol');
goog.require('ol.ImageTile');
goog.require('ol.TileState');
goog.require('ol.TileUrlFunction');
goog.require('ol.asserts');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.size');
goog.require('ol.source.TileImage');
goog.require('ol.tilegrid.TileGrid');


/**
 * @classdesc
 * Layer source for tile data in Zoomify format (both Zoomify and Internet
 * Imaging Protocol are supported).
 *
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.ZoomifyOptions=} opt_options Options.
 * @api
 */
ol.source.Zoomify = function(opt_options) {

  var options = opt_options || {};

  var size = options.size;
  var tierSizeCalculation = options.tierSizeCalculation !== undefined ?
    options.tierSizeCalculation :
    ol.source.Zoomify.TierSizeCalculation_.DEFAULT;

  var imageWidth = size[0];
  var imageHeight = size[1];
  var extent = options.extent || [0, -size[1], size[0], 0];
  var tierSizeInTiles = [];
  var tileSize = options.tileSize || ol.DEFAULT_TILE_SIZE;
  var tileSizeForTierSizeCalculation = tileSize;

  switch (tierSizeCalculation) {
    case ol.source.Zoomify.TierSizeCalculation_.DEFAULT:
      while (imageWidth > tileSizeForTierSizeCalculation || imageHeight > tileSizeForTierSizeCalculation) {
        tierSizeInTiles.push([
          Math.ceil(imageWidth / tileSizeForTierSizeCalculation),
          Math.ceil(imageHeight / tileSizeForTierSizeCalculation)
        ]);
        tileSizeForTierSizeCalculation += tileSizeForTierSizeCalculation;
      }
      break;
    case ol.source.Zoomify.TierSizeCalculation_.TRUNCATED:
      var width = imageWidth;
      var height = imageHeight;
      while (width > tileSizeForTierSizeCalculation || height > tileSizeForTierSizeCalculation) {
        tierSizeInTiles.push([
          Math.ceil(width / tileSizeForTierSizeCalculation),
          Math.ceil(height / tileSizeForTierSizeCalculation)
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

  var tileGrid = new ol.tilegrid.TileGrid({
    tileSize: tileSize,
    extent: extent,
    origin: ol.extent.getTopLeft(extent),
    resolutions: resolutions
  });

  var url = options.url;
  if (url && url.indexOf('{TileGroup}') == -1 && url.indexOf('{tileIndex}') == -1) {
    url += '{TileGroup}/{z}-{x}-{y}.jpg';
  }
  var urls = ol.TileUrlFunction.expandUrl(url);

  /**
   * @param {string} template Template.
   * @return {ol.TileUrlFunctionType} Tile URL function.
   */
  function createFromTemplate(template) {

    return (
      /**
       * @param {ol.TileCoord} tileCoord Tile Coordinate.
       * @param {number} pixelRatio Pixel ratio.
       * @param {ol.proj.Projection} projection Projection.
       * @return {string|undefined} Tile URL.
       */
      function(tileCoord, pixelRatio, projection) {
        if (!tileCoord) {
          return undefined;
        } else {
          var tileCoordZ = tileCoord[0];
          var tileCoordX = tileCoord[1];
          var tileCoordY = -tileCoord[2] - 1;
          var tileIndex =
              tileCoordX +
              tileCoordY * tierSizeInTiles[tileCoordZ][0];
          var tileSize = tileGrid.getTileSize(tileCoordZ);
          var tileGroup = ((tileIndex + tileCountUpToTier[tileCoordZ]) / tileSize) | 0;
          var localContext = {
            'z': tileCoordZ,
            'x': tileCoordX,
            'y': tileCoordY,
            'tileIndex': tileIndex,
            'TileGroup': 'TileGroup' + tileGroup
          };
          return template.replace(/\{(\w+?)\}/g, function(m, p) {
            return localContext[p];
          });
        }
      });
  }

  var tileUrlFunction = ol.TileUrlFunction.createFromTileUrlFunctions(urls.map(createFromTemplate));

  var ZoomifyTileClass = ol.source.Zoomify.Tile_.bind(null, tileGrid);

  ol.source.TileImage.call(this, {
    attributions: options.attributions,
    cacheSize: options.cacheSize,
    crossOrigin: options.crossOrigin,
    logo: options.logo,
    projection: options.projection,
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    tileClass: ZoomifyTileClass,
    tileGrid: tileGrid,
    tileUrlFunction: tileUrlFunction,
    transition: options.transition
  });

};
ol.inherits(ol.source.Zoomify, ol.source.TileImage);

/**
 * @constructor
 * @extends {ol.ImageTile}
 * @param {ol.tilegrid.TileGrid} tileGrid TileGrid that the tile belongs to.
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.TileState} state State.
 * @param {string} src Image source URI.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
 * @param {olx.TileOptions=} opt_options Tile options.
 * @private
 */
ol.source.Zoomify.Tile_ = function(
    tileGrid, tileCoord, state, src, crossOrigin, tileLoadFunction, opt_options) {

  ol.ImageTile.call(this, tileCoord, state, src, crossOrigin, tileLoadFunction, opt_options);

  /**
   * @private
   * @type {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement}
   */
  this.zoomifyImage_ = null;

  /**
   * @private
   * @type {ol.Size}
   */
  this.tileSize_ = ol.size.toSize(tileGrid.getTileSize(tileCoord[0]));
};
ol.inherits(ol.source.Zoomify.Tile_, ol.ImageTile);


/**
 * @inheritDoc
 */
ol.source.Zoomify.Tile_.prototype.getImage = function() {
  if (this.zoomifyImage_) {
    return this.zoomifyImage_;
  }
  var image = ol.ImageTile.prototype.getImage.call(this);
  if (this.state == ol.TileState.LOADED) {
    var tileSize = this.tileSize_;
    if (image.width == tileSize[0] && image.height == tileSize[1]) {
      this.zoomifyImage_ = image;
      return image;
    } else {
      var context = ol.dom.createCanvasContext2D(tileSize[0], tileSize[1]);
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
 * @private
 */
ol.source.Zoomify.TierSizeCalculation_ = {
  DEFAULT: 'default',
  TRUNCATED: 'truncated'
};
