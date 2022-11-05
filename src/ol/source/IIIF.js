/**
 * @module ol/source/IIIF
 */

import TileGrid from '../tilegrid/TileGrid.js';
import TileImage from './TileImage.js';
import {CustomTile} from './Zoomify.js';
import {DEFAULT_TILE_SIZE} from '../tilegrid/common.js';
import {Versions} from '../format/IIIFInfo.js';
import {assert} from '../asserts.js';
import {getTopLeft} from '../extent.js';
import {toSize} from '../size.js';

/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {boolean} [attributionsCollapsible=true] Attributions are collapsible.
 * @property {number} [cacheSize] Deprecated.  Use the cacheSize option on the layer instead.
 * @property {null|string} [crossOrigin] The value for the crossOrigin option of the request.
 * @property {import("../extent.js").Extent} [extent=[0, -height, width, 0]] The extent.
 * @property {string} [format='jpg'] Requested image format.
 * @property {boolean} [interpolate=true] Use interpolated values when resampling.  By default,
 * linear interpolation is used when resampling.  Set to false to use the nearest neighbor instead.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection.
 * @property {string} [quality] Requested IIIF image quality. Default is 'native'
 * for version 1, 'default' for versions 2 and 3.
 * @property {number} [reprojectionErrorThreshold=0.5] Maximum allowed reprojection error (in pixels).
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {Array<number>} [resolutions] Supported resolutions as given in IIIF 'scaleFactors'
 * @property {import("../size.js").Size} size Size of the image [width, height].
 * @property {Array<import("../size.js").Size>} [sizes] Supported scaled image sizes.
 * Content of the IIIF info.json 'sizes' property, but as array of Size objects.
 * @property {import("./Source.js").State} [state] Source state.
 * @property {Array<string>} [supports=[]] Supported IIIF region and size calculation
 * features.
 * @property {number} [tilePixelRatio] Tile pixel ratio.
 * @property {number|import("../size.js").Size} [tileSize] Tile size.
 * Same tile size is used for all zoom levels. If tile size is a number,
 * a square tile is assumed. If the IIIF image service supports arbitrary
 * tiling (sizeByH, sizeByW, sizeByWh or sizeByPct as well as regionByPx or regionByPct
 * are supported), the default tilesize is 256.
 * @property {number} [transition] Transition.
 * @property {string} [url] Base URL of the IIIF Image service.
 * This should be the same as the IIIF Image ID.
 * @property {import("../format/IIIFInfo.js").Versions} [version=Versions.VERSION2] Service's IIIF Image API version.
 * @property {number|import("../array.js").NearestDirectionFunction} [zDirection=0]
 * Choose whether to use tiles with a higher or lower zoom level when between integer
 * zoom levels. See {@link module:ol/tilegrid/TileGrid~TileGrid#getZForResolution}.
 */

function formatPercentage(percentage) {
  return percentage.toLocaleString('en', {maximumFractionDigits: 10});
}

/**
 * @classdesc
 * Layer source for IIIF Image API services.
 * @api
 */
class IIIF extends TileImage {
  /**
   * @param {Options} [options] Tile source options. Use {@link import("../format/IIIFInfo.js").IIIFInfo}
   * to parse Image API service information responses into constructor options.
   * @api
   */
  constructor(options) {
    /**
     * @type {Partial<Options>}
     */
    const partialOptions = options || {};

    let baseUrl = partialOptions.url || '';
    baseUrl =
      baseUrl +
      (baseUrl.lastIndexOf('/') === baseUrl.length - 1 || baseUrl === ''
        ? ''
        : '/');
    const version = partialOptions.version || Versions.VERSION2;
    const sizes = partialOptions.sizes || [];
    const size = partialOptions.size;
    assert(
      size != undefined &&
        Array.isArray(size) &&
        size.length == 2 &&
        !isNaN(size[0]) &&
        size[0] > 0 &&
        !isNaN(size[1]) &&
        size[1] > 0,
      'Missing or invalid `size`',
    );
    const width = size[0];
    const height = size[1];
    const tileSize = partialOptions.tileSize;
    const tilePixelRatio = partialOptions.tilePixelRatio || 1;
    const format = partialOptions.format || 'jpg';
    const quality =
      partialOptions.quality ||
      (partialOptions.version == Versions.VERSION1 ? 'native' : 'default');
    let resolutions = partialOptions.resolutions || [];
    const supports = partialOptions.supports || [];
    const extent = partialOptions.extent || [0, -height, width, 0];

    const supportsListedSizes =
      sizes != undefined && Array.isArray(sizes) && sizes.length > 0;
    const supportsListedTiles =
      tileSize !== undefined &&
      ((typeof tileSize === 'number' &&
        Number.isInteger(tileSize) &&
        tileSize > 0) ||
        (Array.isArray(tileSize) && tileSize.length > 0));
    const supportsArbitraryTiling =
      supports != undefined &&
      Array.isArray(supports) &&
      (supports.includes('regionByPx') || supports.includes('regionByPct')) &&
      (supports.includes('sizeByWh') ||
        supports.includes('sizeByH') ||
        supports.includes('sizeByW') ||
        supports.includes('sizeByPct'));

    let tileWidth, tileHeight, maxZoom;

    resolutions.sort(function (a, b) {
      return b - a;
    });

    if (supportsListedTiles || supportsArbitraryTiling) {
      if (tileSize != undefined) {
        if (
          typeof tileSize === 'number' &&
          Number.isInteger(tileSize) &&
          tileSize > 0
        ) {
          tileWidth = tileSize;
          tileHeight = tileSize;
        } else if (Array.isArray(tileSize) && tileSize.length > 0) {
          if (
            tileSize.length == 1 ||
            (tileSize[1] == undefined && Number.isInteger(tileSize[0]))
          ) {
            tileWidth = tileSize[0];
            tileHeight = tileSize[0];
          }
          if (tileSize.length == 2) {
            if (
              Number.isInteger(tileSize[0]) &&
              Number.isInteger(tileSize[1])
            ) {
              tileWidth = tileSize[0];
              tileHeight = tileSize[1];
            } else if (
              tileSize[0] == undefined &&
              Number.isInteger(tileSize[1])
            ) {
              tileWidth = tileSize[1];
              tileHeight = tileSize[1];
            }
          }
        }
      }
      if (tileWidth === undefined || tileHeight === undefined) {
        tileWidth = DEFAULT_TILE_SIZE;
        tileHeight = DEFAULT_TILE_SIZE;
      }
      if (resolutions.length == 0) {
        maxZoom = Math.max(
          Math.ceil(Math.log(width / tileWidth) / Math.LN2),
          Math.ceil(Math.log(height / tileHeight) / Math.LN2),
        );
        for (let i = maxZoom; i >= 0; i--) {
          resolutions.push(Math.pow(2, i));
        }
      } else {
        const maxScaleFactor = Math.max(...resolutions);
        // TODO maxScaleFactor might not be a power to 2
        maxZoom = Math.round(Math.log(maxScaleFactor) / Math.LN2);
      }
    } else {
      // No tile support.
      tileWidth = width;
      tileHeight = height;
      resolutions = [];
      if (supportsListedSizes) {
        /*
         * 'sizes' provided. Use full region in different resolutions. Every
         * resolution has only one tile.
         */
        sizes.sort(function (a, b) {
          return a[0] - b[0];
        });
        maxZoom = -1;
        const ignoredSizesIndex = [];
        for (let i = 0; i < sizes.length; i++) {
          const resolution = width / sizes[i][0];
          if (
            resolutions.length > 0 &&
            resolutions[resolutions.length - 1] == resolution
          ) {
            ignoredSizesIndex.push(i);
            continue;
          }
          resolutions.push(resolution);
          maxZoom++;
        }
        if (ignoredSizesIndex.length > 0) {
          for (let i = 0; i < ignoredSizesIndex.length; i++) {
            sizes.splice(ignoredSizesIndex[i] - i, 1);
          }
        }
      } else {
        // No useful image information at all. Try pseudo tile with full image.
        resolutions.push(1);
        sizes.push([width, height]);
        maxZoom = 0;
      }
    }

    const tileGrid = new TileGrid({
      tileSize: [tileWidth, tileHeight],
      extent: extent,
      origin: getTopLeft(extent),
      resolutions: resolutions,
    });

    const tileUrlFunction = function (tileCoord, pixelRatio, projection) {
      let regionParam, sizeParam;
      const zoom = tileCoord[0];
      if (zoom > maxZoom) {
        return;
      }
      const tileX = tileCoord[1],
        tileY = tileCoord[2],
        scale = resolutions[zoom];
      if (
        tileX === undefined ||
        tileY === undefined ||
        scale === undefined ||
        tileX < 0 ||
        Math.ceil(width / scale / tileWidth) <= tileX ||
        tileY < 0 ||
        Math.ceil(height / scale / tileHeight) <= tileY
      ) {
        return;
      }
      if (supportsArbitraryTiling || supportsListedTiles) {
        const regionX = tileX * tileWidth * scale,
          regionY = tileY * tileHeight * scale;
        let regionW = tileWidth * scale,
          regionH = tileHeight * scale,
          sizeW = tileWidth,
          sizeH = tileHeight;
        if (regionX + regionW > width) {
          regionW = width - regionX;
        }
        if (regionY + regionH > height) {
          regionH = height - regionY;
        }
        if (regionX + tileWidth * scale > width) {
          sizeW = Math.floor((width - regionX + scale - 1) / scale);
        }
        if (regionY + tileHeight * scale > height) {
          sizeH = Math.floor((height - regionY + scale - 1) / scale);
        }
        if (
          regionX == 0 &&
          regionW == width &&
          regionY == 0 &&
          regionH == height
        ) {
          // canonical full image region parameter is 'full', not 'x,y,w,h'
          regionParam = 'full';
        } else if (
          !supportsArbitraryTiling ||
          supports.includes('regionByPx')
        ) {
          regionParam = regionX + ',' + regionY + ',' + regionW + ',' + regionH;
        } else if (supports.includes('regionByPct')) {
          const pctX = formatPercentage((regionX / width) * 100),
            pctY = formatPercentage((regionY / height) * 100),
            pctW = formatPercentage((regionW / width) * 100),
            pctH = formatPercentage((regionH / height) * 100);
          regionParam = 'pct:' + pctX + ',' + pctY + ',' + pctW + ',' + pctH;
        }
        if (
          version == Versions.VERSION3 &&
          (!supportsArbitraryTiling || supports.includes('sizeByWh'))
        ) {
          sizeParam = sizeW + ',' + sizeH;
        } else if (!supportsArbitraryTiling || supports.includes('sizeByW')) {
          sizeParam = sizeW + ',';
        } else if (supports.includes('sizeByH')) {
          sizeParam = ',' + sizeH;
        } else if (supports.includes('sizeByWh')) {
          sizeParam = sizeW + ',' + sizeH;
        } else if (supports.includes('sizeByPct')) {
          sizeParam = 'pct:' + formatPercentage(100 / scale);
        }
      } else {
        regionParam = 'full';
        if (supportsListedSizes) {
          const regionWidth = sizes[zoom][0],
            regionHeight = sizes[zoom][1];
          if (version == Versions.VERSION3) {
            if (regionWidth == width && regionHeight == height) {
              sizeParam = 'max';
            } else {
              sizeParam = regionWidth + ',' + regionHeight;
            }
          } else {
            if (regionWidth == width) {
              sizeParam = 'full';
            } else {
              sizeParam = regionWidth + ',';
            }
          }
        } else {
          sizeParam = version == Versions.VERSION3 ? 'max' : 'full';
        }
      }
      return (
        baseUrl + regionParam + '/' + sizeParam + '/0/' + quality + '.' + format
      );
    };

    const IiifTileClass = CustomTile.bind(
      null,
      toSize(tileSize || 256).map(function (size) {
        return size * tilePixelRatio;
      }),
    );

    super({
      attributions: partialOptions.attributions,
      attributionsCollapsible: partialOptions.attributionsCollapsible,
      cacheSize: partialOptions.cacheSize,
      crossOrigin: partialOptions.crossOrigin,
      interpolate: partialOptions.interpolate,
      projection: partialOptions.projection,
      reprojectionErrorThreshold: partialOptions.reprojectionErrorThreshold,
      state: partialOptions.state,
      tileClass: IiifTileClass,
      tileGrid: tileGrid,
      tilePixelRatio: partialOptions.tilePixelRatio,
      tileUrlFunction: tileUrlFunction,
      transition: partialOptions.transition,
    });

    /**
     * @type {number|import("../array.js").NearestDirectionFunction}
     */
    this.zDirection = partialOptions.zDirection;
  }
}

export default IIIF;
