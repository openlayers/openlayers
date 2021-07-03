/**
 * @module ol/source/Stamen
 */

import XYZ from './XYZ.js';
import {ATTRIBUTION as OSM_ATTRIBUTION} from './OSM.js';

/**
 * @const
 * @type {Array<string>}
 */
const ATTRIBUTIONS = [
  'Map tiles by <a href="https://stamen.com/" target="_blank">Stamen Design</a>, ' +
    'under <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank">CC BY' +
    ' 3.0</a>.',
  OSM_ATTRIBUTION,
];

/**
 * @type {Object<string, {extension: string, opaque: boolean}>}
 */
const LayerConfig = {
  'terrain': {
    extension: 'jpg',
    opaque: true,
  },
  'terrain-background': {
    extension: 'jpg',
    opaque: true,
  },
  'terrain-labels': {
    extension: 'png',
    opaque: false,
  },
  'terrain-lines': {
    extension: 'png',
    opaque: false,
  },
  'toner-background': {
    extension: 'png',
    opaque: true,
  },
  'toner': {
    extension: 'png',
    opaque: true,
  },
  'toner-hybrid': {
    extension: 'png',
    opaque: false,
  },
  'toner-labels': {
    extension: 'png',
    opaque: false,
  },
  'toner-lines': {
    extension: 'png',
    opaque: false,
  },
  'toner-lite': {
    extension: 'png',
    opaque: true,
  },
  'watercolor': {
    extension: 'jpg',
    opaque: true,
  },
};

/**
 * @type {Object<string, {minZoom: number, maxZoom: number}>}
 */
const ProviderConfig = {
  'terrain': {
    minZoom: 0,
    maxZoom: 18,
  },
  'toner': {
    minZoom: 0,
    maxZoom: 20,
  },
  'watercolor': {
    minZoom: 0,
    maxZoom: 18,
  },
};

/**
 * @typedef {Object} Options
 * @property {number} [cacheSize] Initial tile cache size. Will auto-grow to hold at least the number of tiles in the viewport.
 * @property {boolean} [imageSmoothing=true] Enable image smoothing.
 * @property {string} layer Layer name.
 * @property {number} [minZoom] Minimum zoom.
 * @property {number} [maxZoom] Maximum zoom.
 * @property {number} [reprojectionErrorThreshold=0.5] Maximum allowed reprojection error (in pixels).
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {import("../Tile.js").LoadFunction} [tileLoadFunction]
 * Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @property {number} [transition=250] Duration of the opacity transition for rendering.
 * To disable the opacity transition, pass `transition: 0`.
 * @property {string} [url] URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * @property {boolean} [wrapX=true] Whether to wrap the world horizontally.
 * @property {number|import("../array.js").NearestDirectionFunction} [zDirection=0]
 * Choose whether to use tiles with a higher or lower zoom level when between integer
 * zoom levels. See {@link module:ol/tilegrid/TileGrid~TileGrid#getZForResolution}.
 */

/**
 * @classdesc
 * Layer source for the Stamen tile server.
 * @api
 */
class Stamen extends XYZ {
  /**
   * @param {Options} options Stamen options.
   */
  constructor(options) {
    const i = options.layer.indexOf('-');
    const provider = i == -1 ? options.layer : options.layer.slice(0, i);
    const providerConfig = ProviderConfig[provider];

    const layerConfig = LayerConfig[options.layer];

    const url =
      options.url !== undefined
        ? options.url
        : 'https://stamen-tiles-{a-d}.a.ssl.fastly.net/' +
          options.layer +
          '/{z}/{x}/{y}.' +
          layerConfig.extension;

    super({
      attributions: ATTRIBUTIONS,
      cacheSize: options.cacheSize,
      crossOrigin: 'anonymous',
      imageSmoothing: options.imageSmoothing,
      maxZoom:
        options.maxZoom != undefined ? options.maxZoom : providerConfig.maxZoom,
      minZoom:
        options.minZoom != undefined ? options.minZoom : providerConfig.minZoom,
      opaque: layerConfig.opaque,
      reprojectionErrorThreshold: options.reprojectionErrorThreshold,
      tileLoadFunction: options.tileLoadFunction,
      transition: options.transition,
      url: url,
      wrapX: options.wrapX,
      zDirection: options.zDirection,
    });
  }
}

export default Stamen;
