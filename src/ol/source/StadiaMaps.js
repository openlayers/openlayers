/**
 * @module ol/source/StadiaMaps
 */

import {ATTRIBUTION as OSM_ATTRIBUTION} from './OSM.js';
import XYZ from './XYZ.js';

/**
 * @type {string}
 */
const STADIA_ATTRIBUTION =
  '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>';

/**
 * @type {string}
 */
const OMT_ATTRIBUTION =
  '&copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>';

/**
 * @type {string}
 */
const STAMEN_ATTRIBUTION =
  '&copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a>';

/**
 * @type {Object<string, {extension: string}>}
 */
const LayerConfig = {
  'stamen_terrain': {
    extension: 'png',
  },
  'stamen_terrain_background': {
    extension: 'png',
  },
  'stamen_terrain_labels': {
    extension: 'png',
  },
  'stamen_terrain_lines': {
    extension: 'png',
  },
  'stamen_toner_background': {
    extension: 'png',
  },
  'stamen_toner': {
    extension: 'png',
  },
  'stamen_toner_labels': {
    extension: 'png',
  },
  'stamen_toner_lines': {
    extension: 'png',
  },
  'stamen_toner_lite': {
    extension: 'png',
  },
  'stamen_watercolor': {
    extension: 'jpg',
  },
  'alidade_smooth': {
    extension: 'png',
  },
  'alidade_smooth_dark': {
    extension: 'png',
  },
  'alidade_satellite': {
    extension: 'png',
  },
  'outdoors': {
    extension: 'png',
  },
  'osm_bright': {
    extension: 'png',
  },
};

/**
 * @type {Object<string, {minZoom: number, maxZoom: number, retina: boolean}>}
 */
const ProviderConfig = {
  'stamen_terrain': {
    minZoom: 0,
    maxZoom: 18,
    retina: true,
  },
  'stamen_toner': {
    minZoom: 0,
    maxZoom: 20,
    retina: true,
  },
  'stamen_watercolor': {
    minZoom: 1,
    maxZoom: 18,
    retina: false,
  },
};

/**
 * @typedef {Object} Options
 * @property {number} [cacheSize] Deprecated.  Use the cacheSize option on the layer instead.
 * @property {boolean} [interpolate=true] Use interpolated values when resampling.  By default,
 * linear interpolation is used when resampling.  Set to false to use the nearest neighbor instead.
 * @property {string} layer Layer name. Valid values: `alidade_smooth`, `alidade_smooth_dark`, `outdoors`, `stamen_terrain`, `stamen_terrain_background`, `stamen_terrain_labels`, `stamen_terrain_lines`, `stamen_toner_background`, `stamen_toner`, `stamen_toner_labels`, `stamen_toner_lines`, `stamen_toner_lite`, `stamen_watercolor`, and `osm_bright`.
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
 * @property {string} [apiKey] Stadia Maps API key. Not required for localhost or most public web deployments. See https://docs.stadiamaps.com/authentication/ for details.
 * @property {boolean} [retina] Use retina tiles (if available; not available for Stamen Watercolor).
 */

/**
 * @classdesc
 * Layer source for the Stadia Maps tile server.
 * @api
 */
class StadiaMaps extends XYZ {
  /**
   * @param {Options} options StadiaMaps options.
   */
  constructor(options) {
    const i = options.layer.indexOf('-');
    const provider = i == -1 ? options.layer : options.layer.slice(0, i);
    const providerConfig = ProviderConfig[provider] || {
      'minZoom': 0,
      'maxZoom': 20,
      'retina': true,
    };

    const layerConfig = LayerConfig[options.layer];
    const query = options.apiKey ? '?api_key=' + options.apiKey : '';
    const retina = providerConfig.retina && options.retina ? '@2x' : '';

    const url =
      options.url !== undefined
        ? options.url
        : 'https://tiles.stadiamaps.com/tiles/' +
          options.layer +
          '/{z}/{x}/{y}' +
          retina +
          '.' +
          layerConfig.extension +
          query;

    const attributions = [STADIA_ATTRIBUTION, OMT_ATTRIBUTION, OSM_ATTRIBUTION];

    if (options.layer.startsWith('stamen_')) {
      attributions.splice(1, 0, STAMEN_ATTRIBUTION);
    }

    super({
      attributions: attributions,
      cacheSize: options.cacheSize,
      crossOrigin: 'anonymous',
      interpolate: options.interpolate,
      maxZoom:
        options.maxZoom !== undefined
          ? options.maxZoom
          : providerConfig.maxZoom,
      minZoom:
        options.minZoom !== undefined
          ? options.minZoom
          : providerConfig.minZoom,
      reprojectionErrorThreshold: options.reprojectionErrorThreshold,
      tileLoadFunction: options.tileLoadFunction,
      transition: options.transition,
      url: url,
      tilePixelRatio: retina ? 2 : 1,
      wrapX: options.wrapX,
      zDirection: options.zDirection,
    });
  }
}

export default StadiaMaps;
