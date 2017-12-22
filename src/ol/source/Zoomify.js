/**
 * @module ol/source/Zoomify
 */
import {DEFAULT_TILE_SIZE} from '../tilegrid/common.js';
import {inherits} from '../index.js';
import ImageTile from '../ImageTile.js';
import TileState from '../TileState.js';
import {expandUrl, createFromTileUrlFunctions} from '../tileurlfunction.js';
import {assert} from '../asserts.js';
import {createCanvasContext2D} from '../dom.js';
import {getTopLeft} from '../extent.js';
import _ol_size_ from '../size.js';
import _ol_source_TileImage_ from '../source/TileImage.js';
import TileGrid from '../tilegrid/TileGrid.js';

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
var _ol_source_Zoomify_ = function(opt_options) {

  var options = opt_options || {};

  var size = options.size;
  var tierSizeCalculation = options.tierSizeCalculation !== undefined ?
    options.tierSizeCalculation :
    _ol_source_Zoomify_.TierSizeCalculation_.DEFAULT;

  var imageWidth = size[0];
  var imageHeight = size[1];
  var extent = options.extent || [0, -size[1], size[0], 0];
  var tierSizeInTiles = [];
  var tileSize = options.tileSize || DEFAULT_TILE_SIZE;
  var tileSizeForTierSizeCalculation = tileSize;

  switch (tierSizeCalculation) {
    case _ol_source_Zoomify_.TierSizeCalculation_.DEFAULT:
      while (imageWidth > tileSizeForTierSizeCalculation || imageHeight > tileSizeForTierSizeCalculation) {
        tierSizeInTiles.push([
          Math.ceil(imageWidth / tileSizeForTierSizeCalculation),
          Math.ceil(imageHeight / tileSizeForTierSizeCalculation)
        ]);
        tileSizeForTierSizeCalculation += tileSizeForTierSizeCalculation;
      }
      break;
    case _ol_source_Zoomify_.TierSizeCalculation_.TRUNCATED:
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
      assert(false, 53); // Unknown `tierSizeCalculation` configured
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

  var tileGrid = new TileGrid({
    tileSize: tileSize,
    extent: extent,
    origin: getTopLeft(extent),
    resolutions: resolutions
  });

  var url = options.url;
  if (url && url.indexOf('{TileGroup}') == -1 && url.indexOf('{tileIndex}') == -1) {
    url += '{TileGroup}/{z}-{x}-{y}.jpg';
  }
  var urls = expandUrl(url);

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

  var tileUrlFunction = createFromTileUrlFunctions(urls.map(createFromTemplate));

  var ZoomifyTileClass = _ol_source_Zoomify_.Tile_.bind(null, tileGrid);

  _ol_source_TileImage_.call(this, {
    attributions: options.attributions,
    cacheSize: options.cacheSize,
    crossOrigin: options.crossOrigin,
    projection: options.projection,
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    tileClass: ZoomifyTileClass,
    tileGrid: tileGrid,
    tileUrlFunction: tileUrlFunction,
    transition: options.transition
  });

};

inherits(_ol_source_Zoomify_, _ol_source_TileImage_);

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
_ol_source_Zoomify_.Tile_ = function(
    tileGrid, tileCoord, state, src, crossOrigin, tileLoadFunction, opt_options) {

  ImageTile.call(this, tileCoord, state, src, crossOrigin, tileLoadFunction, opt_options);

  /**
   * @private
   * @type {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement}
   */
  this.zoomifyImage_ = null;

  /**
   * @private
   * @type {ol.Size}
   */
  this.tileSize_ = _ol_size_.toSize(tileGrid.getTileSize(tileCoord[0]));
};
inherits(_ol_source_Zoomify_.Tile_, ImageTile);


/**
 * @inheritDoc
 */
_ol_source_Zoomify_.Tile_.prototype.getImage = function() {
  if (this.zoomifyImage_) {
    return this.zoomifyImage_;
  }
  var image = ImageTile.prototype.getImage.call(this);
  if (this.state == TileState.LOADED) {
    var tileSize = this.tileSize_;
    if (image.width == tileSize[0] && image.height == tileSize[1]) {
      this.zoomifyImage_ = image;
      return image;
    } else {
      var context = createCanvasContext2D(tileSize[0], tileSize[1]);
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
_ol_source_Zoomify_.TierSizeCalculation_ = {
  DEFAULT: 'default',
  TRUNCATED: 'truncated'
};
export default _ol_source_Zoomify_;
