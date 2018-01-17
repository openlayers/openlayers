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
import TileImage from '../source/TileImage.js';
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
const Zoomify = function(opt_options) {

  const options = opt_options || {};

  const size = options.size;
  const tierSizeCalculation = options.tierSizeCalculation !== undefined ?
    options.tierSizeCalculation :
    Zoomify.TierSizeCalculation_.DEFAULT;

  const imageWidth = size[0];
  const imageHeight = size[1];
  const extent = options.extent || [0, -size[1], size[0], 0];
  const tierSizeInTiles = [];
  const tileSize = options.tileSize || DEFAULT_TILE_SIZE;
  let tileSizeForTierSizeCalculation = tileSize;

  switch (tierSizeCalculation) {
    case Zoomify.TierSizeCalculation_.DEFAULT:
      while (imageWidth > tileSizeForTierSizeCalculation || imageHeight > tileSizeForTierSizeCalculation) {
        tierSizeInTiles.push([
          Math.ceil(imageWidth / tileSizeForTierSizeCalculation),
          Math.ceil(imageHeight / tileSizeForTierSizeCalculation)
        ]);
        tileSizeForTierSizeCalculation += tileSizeForTierSizeCalculation;
      }
      break;
    case Zoomify.TierSizeCalculation_.TRUNCATED:
      let width = imageWidth;
      let height = imageHeight;
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

  const resolutions = [1];
  const tileCountUpToTier = [0];
  for (let i = 1, ii = tierSizeInTiles.length; i < ii; i++) {
    resolutions.push(1 << i);
    tileCountUpToTier.push(
      tierSizeInTiles[i - 1][0] * tierSizeInTiles[i - 1][1] +
        tileCountUpToTier[i - 1]
    );
  }
  resolutions.reverse();

  const tileGrid = new TileGrid({
    tileSize: tileSize,
    extent: extent,
    origin: getTopLeft(extent),
    resolutions: resolutions
  });

  let url = options.url;
  if (url && url.indexOf('{TileGroup}') == -1 && url.indexOf('{tileIndex}') == -1) {
    url += '{TileGroup}/{z}-{x}-{y}.jpg';
  }
  const urls = expandUrl(url);

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
          const tileCoordZ = tileCoord[0];
          const tileCoordX = tileCoord[1];
          const tileCoordY = -tileCoord[2] - 1;
          const tileIndex =
              tileCoordX +
              tileCoordY * tierSizeInTiles[tileCoordZ][0];
          const tileSize = tileGrid.getTileSize(tileCoordZ);
          const tileGroup = ((tileIndex + tileCountUpToTier[tileCoordZ]) / tileSize) | 0;
          const localContext = {
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

  const tileUrlFunction = createFromTileUrlFunctions(urls.map(createFromTemplate));

  const ZoomifyTileClass = Zoomify.Tile_.bind(null, tileGrid);

  TileImage.call(this, {
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

inherits(Zoomify, TileImage);

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
Zoomify.Tile_ = function(
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
inherits(Zoomify.Tile_, ImageTile);


/**
 * @inheritDoc
 */
Zoomify.Tile_.prototype.getImage = function() {
  if (this.zoomifyImage_) {
    return this.zoomifyImage_;
  }
  const image = ImageTile.prototype.getImage.call(this);
  if (this.state == TileState.LOADED) {
    const tileSize = this.tileSize_;
    if (image.width == tileSize[0] && image.height == tileSize[1]) {
      this.zoomifyImage_ = image;
      return image;
    } else {
      const context = createCanvasContext2D(tileSize[0], tileSize[1]);
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
Zoomify.TierSizeCalculation_ = {
  DEFAULT: 'default',
  TRUNCATED: 'truncated'
};
export default Zoomify;
