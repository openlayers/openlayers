/**
 * @module ol/source/IIIF
 */

import {DEFAULT_TILE_SIZE} from '../tilegrid/common.js';
import {getTopLeft} from '../extent.js';
import {CustomTile} from './Zoomify.js';
import {Versions} from '../format/IIIFInfo.js';
import {assert} from '../asserts.js';
import TileGrid from '../tilegrid/TileGrid.js';
import TileImage from './TileImage.js';

/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {boolean} [attributionsCollapsible=true] Attributions are collapsible.
 * @property {number} [cacheSize]
 * @property {null|string} [crossOrigin]
 * @property {import("../proj.js").ProjectionLike} [projection]
 * @property {number} [tilePixelRatio]
 * @property {number} [reprojectionErrorThreshold=0.5]
 * @property {string} [url] Base URL of the IIIF Image service.
 * This shoulf be the same as the IIIF Image @id.
 * @property {import("../size.js").Size} [size] Size of the image [width, height].
 * @property {import("../size.js").Size[]} [sizes] Supported scaled image sizes.
 * Content of the IIIF info.json 'sizes' property, but as array of Size objects.
 * @property {import("../extent.js").Extent} [extent=[0, -height, width, 0]]
 * @property {number} [transition]
 * @property {number|import("../size.js").Size} [tileSize] Tile size.
 * Same tile size is used for all zoom levels. If tile size is a number,
 * a square tile is assumed. If the IIIF image service supports arbitrary
 * tiling (sizeByH, sizeByW or sizeByPct as well as regionByPx and regionByPct
 * are supported), the default tilesize is 256.
 * @property {boolean} [wrapX=false]
 */

function formatPercentage(percentage) {
  return percentage.toLocaleString('en', {maximumFractionDigits: 10});
}

/**
 * @classdesc
 * Layer source for tile data in IIIF format.
 * @api
 */
class IIIF extends TileImage {

  constructor(opt_options) {

    const options = opt_options || {};

    let baseUrl = options.url || '';
    baseUrl = baseUrl + (baseUrl.lastIndexOf('/') === baseUrl.length - 1 || baseUrl === '' ? '' : '/');
    const version = options.version || Versions.VERSION2;
    const sizes = options.sizes || [];
    const size = options.size;
    assert(size != undefined && Array.isArray(size) && size.length == 2 &&
      !isNaN(size[0]) && size[0] > 0 && !isNaN(size[1] && size[1] > 0), 60);
    const width = size[0];
    const height = size[1];
    const tileSize = options.tileSize;
    const format = options.format || 'jpg';
    const quality = options.quality || (options.version == Versions.VERSION1 ? 'native' : 'default');
    let resolutions = options.resolutions || [];
    const features = options.features || [];
    const extent = options.extent || [0, -height, width, 0];

    const supportsListedSizes = sizes != undefined && Array.isArray(sizes) && sizes.length > 0;
    const supportsListedTiles = tileSize != undefined && (Number.isInteger(tileSize) && tileSize > 0 || Array.isArray(tileSize) && tileSize.length > 0);
    const supportsArbitraryTiling = features != undefined && Array.isArray(features) &&
      (features.includes('regionByPx') || features.includes('regionByPct')) &&
      (features.includes('sizeByWh') || features.includes('sizeByH') ||
      features.includes('sizeByW') || features.includes('sizeByPct'));

    let tileWidth,
        tileHeight,
        maxZoom;

    resolutions.sort(function(a, b) {
      return b - a;
    });

    if (supportsListedTiles || supportsArbitraryTiling) {
      if (tileSize != undefined) {
        if (Number.isInteger(tileSize) && tileSize > 0) {
          tileWidth = tileSize;
          tileHeight = tileSize;
        } else if (Array.isArray(tileSize) && tileSize.length > 0) {
          if (tileSize.length == 1 || tileSize[1] == undefined && Number.isInteger(tileSize[0])) {
            tileWidth = tileSize[0];
            tileHeight = tileSize[0];
          }
          if (tileSize.length == 2) {
            if (Number.isInteger(tileSize[0]) && Number.isInteger(tileSize[1])) {
              tileWidth = tileSize[0];
              tileHeight = tileSize[1];
            } else if (tileSize[0] == undefined && Number.isInteger(tileSize[1])) {
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
          Math.ceil(Math.log(height / tileHeight) / Math.LN2)
        );
        for (let i = maxZoom; i >= 0; i--) {
          resolutions.push(Math.pow(2, i));
        }
      } else {
        const maxScaleFactor = Math.max([...resolutions]);
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
        sizes.sort(function(a, b) {
          return a[0] - b[0];
        });
        for (let i = 0; i < sizes.length; i++) {
          const resolution = width / sizes[i][0];
          resolutions.push(resolution);
          maxZoom = i;
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
      resolutions: resolutions
    });

    const tileUrlFunction = function(tileCoord, pixelRatio, projection) {
      let regionParam,
          sizeParam;
      const zoom = tileCoord[0];
      if (maxZoom < zoom) {
        return;
      }
      const tileX = tileCoord[1],
          tileY = tileCoord[2],
          scale = resolutions[zoom];
      if (tileX < 0 || Math.ceil(width / scale / tileWidth) <= tileX ||
      tileY < 0 || Math.ceil(height / scale / tileHeight) <= tileY) {
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
        if (regionX == 0 && regionW == width && regionY == 0 && regionH == height) {
          // canonical full image region parameter is 'full', not 'x,y,w,h'
          regionParam = 'full';
        } else if (!supportsArbitraryTiling || features.includes('regionByPx')) {
          regionParam = regionX + ',' + regionY + ',' + regionW + ',' + regionH;
        } else if (features.includes('regionByPct')) {
          const pctX = formatPercentage(regionX / width * 100),
              pctY = formatPercentage(regionY / height * 100),
              pctW = formatPercentage(regionW / width * 100),
              pctH = formatPercentage(regionH / height * 100);
          regionParam = 'pct:' + pctX + ',' + pctY + ',' + pctW + ',' + pctH;
        }
        if (version == Versions.VERSION3 && (!supportsArbitraryTiling || features.includes('sizeByWh'))) {
          sizeParam = sizeW + ',' + sizeH;
        } else if (!supportsArbitraryTiling || features.includes('sizeByW')) {
          sizeParam = sizeW + ',';
        } else if (features.includes('sizeByH')) {
          sizeParam = ',' + sizeH;
        } else if (features.includes('sizeByWh')) {
          sizeParam = sizeW + ',' + sizeH;
        } else if (features.includes('sizeByPct')) {
          sizeParam = 'pct:' + formatPercentage(100 / scale);
        }
      } else {
        regionParam = 'full';
        if (supportsListedSizes) {
          sizeParam = sizes[zoom][0] + ',' + (version == Versions.VERSION3 ? sizes[zoom][1] : '');
        } else {
          sizeParam = version == Versions.VERSION3 ? 'max' : 'full';
        }
      }
      return baseUrl + regionParam + '/' + sizeParam + '/0/' + quality + '.' + format;
    };

    const IiifTileClass = CustomTile.bind(null, tileGrid);

    super({
      attributions: options.attributions,
      attributionsCollapsible: options.attributionsCollapsible,
      cacheSize: options.cacheSize,
      crossOrigin: options.crossOrigin,
      opaque: options.opaque,
      projection: options.projection,
      reprojectionErrorThreshold: options.reprojectionErrorThreshold,
      state: options.state,
      tileClass: IiifTileClass,
      transition: options.transition,
      wrapX: options.wrapX !== undefined ? options.wrapX : false,
      tileGrid: tileGrid,
      tilePixelRatio: options.tilePixelRatio,
      tileUrlFunction: tileUrlFunction
    });

  }

}

export default IIIF;
