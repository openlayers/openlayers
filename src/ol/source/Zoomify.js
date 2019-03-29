/**
 * @module ol/source/Zoomify
 */
import {DEFAULT_TILE_SIZE} from '../tilegrid/common.js';

import ImageTile from '../ImageTile.js';
import TileState from '../TileState.js';
import {expandUrl, createFromTileUrlFunctions} from '../tileurlfunction.js';
import {assert} from '../asserts.js';
import {createCanvasContext2D} from '../dom.js';
import {getTopLeft} from '../extent.js';
import {toSize} from '../size.js';
import TileImage from './TileImage.js';
import TileGrid from '../tilegrid/TileGrid.js';


/**
 * @enum {string}
 */
const TierSizeCalculation = {
  DEFAULT: 'default',
  TRUNCATED: 'truncated'
};


export class CustomTile extends ImageTile {

  /**
   * @param {import("../tilegrid/TileGrid.js").default} tileGrid TileGrid that the tile belongs to.
   * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {TileState} state State.
   * @param {string} src Image source URI.
   * @param {?string} crossOrigin Cross origin.
   * @param {import("../Tile.js").LoadFunction} tileLoadFunction Tile load function.
   * @param {import("../Tile.js").Options=} opt_options Tile options.
   */
  constructor(tileGrid, tileCoord, state, src, crossOrigin, tileLoadFunction, opt_options) {

    super(tileCoord, state, src, crossOrigin, tileLoadFunction, opt_options);

    /**
     * @private
     * @type {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement}
     */
    this.zoomifyImage_ = null;

    /**
     * @private
     * @type {import("../size.js").Size}
     */
    this.tileSize_ = toSize(tileGrid.getTileSize(tileCoord[0]));

  }

  /**
   * @inheritDoc
   */
  getImage() {
    if (this.zoomifyImage_) {
      return this.zoomifyImage_;
    }
    const image = super.getImage();
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
  }

}


/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {number} [cacheSize] Tile cache size. The default depends on the screen size. Will increase if too small.
 * @property {null|string} [crossOrigin] The `crossOrigin` attribute for loaded images.  Note that
 * you must provide a `crossOrigin` value  you want to access pixel data with the Canvas renderer.
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection.
 * @property {number} [tilePixelRatio] The pixel ratio used by the tile service. For example, if the tile service advertizes 256px by 256px tiles but actually sends 512px by 512px images (for retina/hidpi devices) then `tilePixelRatio` should be set to `2`
 * @property {number} [reprojectionErrorThreshold=0.5] Maximum allowed reprojection error (in pixels).
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {string} [url] URL template or base URL of the Zoomify service.
 * A base URL is the fixed part
 * of the URL, excluding the tile group, z, x, and y folder structure, e.g.
 * `http://my.zoomify.info/IMAGE.TIF/`. A URL template must include
 * `{TileGroup}`, `{x}`, `{y}`, and `{z}` placeholders, e.g.
 * `http://my.zoomify.info/IMAGE.TIF/{TileGroup}/{z}-{x}-{y}.jpg`.
 * Internet Imaging Protocol (IIP) with JTL extension can be also used with
 * `{tileIndex}` and `{z}` placeholders, e.g.
 * `http://my.zoomify.info?FIF=IMAGE.TIF&JTL={z},{tileIndex}`.
 * A `{?-?}` template pattern, for example `subdomain{a-f}.domain.com`, may be
 * used instead of defining each one separately in the `urls` option.
 * @property {string} [tierSizeCalculation] Tier size calculation method: `default` or `truncated`.
 * @property {import("../size.js").Size} [size] Size of the image.
 * @property {import("../extent.js").Extent} [extent] Extent for the TileGrid that is created.
 * Default sets the TileGrid in the
 * fourth quadrant, meaning extent is `[0, -height, width, 0]`. To change the
 * extent to the first quadrant (the default for OpenLayers 2) set the extent
 * as `[0, 0, width, height]`.
 * @property {number} [transition] Duration of the opacity transition for rendering.
 * To disable the opacity transition, pass `transition: 0`.
 * @property {number} [tileSize=256] Tile size. Same tile size is used for all zoom levels.
 * @property {number} [zDirection] Indicate which resolution should be used
 * by a renderer if the views resolution does not match any resolution of the tile source.
 * If 0, the nearest resolution will be used. If 1, the nearest lower resolution
 * will be used. If -1, the nearest higher resolution will be used.
 */


/**
 * @classdesc
 * Layer source for tile data in Zoomify format (both Zoomify and Internet
 * Imaging Protocol are supported).
 * @api
 */
class Zoomify extends TileImage {

  /**
   * @param {Options=} opt_options Options.
   */
  constructor(opt_options) {

    const options = opt_options || {};

    const size = options.size;
    const tierSizeCalculation = options.tierSizeCalculation !== undefined ?
      options.tierSizeCalculation :
      TierSizeCalculation.DEFAULT;

    const imageWidth = size[0];
    const imageHeight = size[1];
    const extent = options.extent || [0, -size[1], size[0], 0];
    const tierSizeInTiles = [];
    const tileSize = options.tileSize || DEFAULT_TILE_SIZE;
    let tileSizeForTierSizeCalculation = tileSize;

    switch (tierSizeCalculation) {
      case TierSizeCalculation.DEFAULT:
        while (imageWidth > tileSizeForTierSizeCalculation || imageHeight > tileSizeForTierSizeCalculation) {
          tierSizeInTiles.push([
            Math.ceil(imageWidth / tileSizeForTierSizeCalculation),
            Math.ceil(imageHeight / tileSizeForTierSizeCalculation)
          ]);
          tileSizeForTierSizeCalculation += tileSizeForTierSizeCalculation;
        }
        break;
      case TierSizeCalculation.TRUNCATED:
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
     * @return {import("../Tile.js").UrlFunction} Tile URL function.
     */
    function createFromTemplate(template) {

      return (
        /**
         * @param {import("../tilecoord.js").TileCoord} tileCoord Tile Coordinate.
         * @param {number} pixelRatio Pixel ratio.
         * @param {import("../proj/Projection.js").default} projection Projection.
         * @return {string|undefined} Tile URL.
         */
        function(tileCoord, pixelRatio, projection) {
          if (!tileCoord) {
            return undefined;
          } else {
            const tileCoordZ = tileCoord[0];
            const tileCoordX = tileCoord[1];
            const tileCoordY = tileCoord[2];
            const tileIndex =
                tileCoordX +
                tileCoordY * tierSizeInTiles[tileCoordZ][0];
            const tileSize = tileGrid.getTileSize(tileCoordZ);
            const tileWidth = Array.isArray(tileSize) ? tileSize[0] : tileSize;
            const tileGroup = ((tileIndex + tileCountUpToTier[tileCoordZ]) / tileWidth) | 0;
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
        }
      );
    }

    const tileUrlFunction = createFromTileUrlFunctions(urls.map(createFromTemplate));

    const ZoomifyTileClass = CustomTile.bind(null, tileGrid);

    super({
      attributions: options.attributions,
      cacheSize: options.cacheSize,
      crossOrigin: options.crossOrigin,
      projection: options.projection,
      tilePixelRatio: options.tilePixelRatio,
      reprojectionErrorThreshold: options.reprojectionErrorThreshold,
      tileClass: ZoomifyTileClass,
      tileGrid: tileGrid,
      tileUrlFunction: tileUrlFunction,
      transition: options.transition
    });

    /**
     * @inheritDoc
     */
    this.zDirection = options.zDirection;

  }

}

export default Zoomify;
