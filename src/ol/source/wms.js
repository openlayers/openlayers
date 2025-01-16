/**
 * @module ol/source/wms
 */

import {decode} from '../Image.js';
import {getForViewAndSize, getHeight, getWidth} from '../extent.js';
import {floor, round} from '../math.js';
import {get as getProjection} from '../proj.js';
import {compareVersions} from '../string.js';
import {appendParams} from '../uri.js';
import {getRequestExtent} from './Image.js';
import {DECIMALS} from './common.js';

/**
 * Default WMS version.
 * @type {string}
 */
export const DEFAULT_VERSION = '1.3.0';

/**
 * @const
 * @type {import("../size.js").Size}
 */
const GETFEATUREINFO_IMAGE_SIZE = [101, 101];

/**
 * @api
 * @typedef {'carmentaserver' | 'geoserver' | 'mapserver' | 'qgis'} ServerType
 * Set the server type to use implementation-specific parameters beyond the WMS specification.
 *  - `'carmentaserver'`: HiDPI support for [Carmenta Server](https://www.carmenta.com/en/products/carmenta-server)
 *  - `'geoserver'`: HiDPI support for [GeoServer](https://geoserver.org/)
 *  - `'mapserver'`: HiDPI support for [MapServer](https://mapserver.org/)
 *  - `'qgis'`: HiDPI support for [QGIS](https://qgis.org/)
 */

/**
 * @param {string} baseUrl Base URL.
 * @param {import("../extent.js").Extent} extent Extent.
 * @param {import("../size.js").Size} size Size.
 * @param {import("../proj/Projection.js").default} projection Projection.
 * @param {Object} params WMS params. Will be modified in place.
 * @return {string} Request URL.
 */
export function getRequestUrl(baseUrl, extent, size, projection, params) {
  params['WIDTH'] = size[0];
  params['HEIGHT'] = size[1];

  const axisOrientation = projection.getAxisOrientation();
  const v13 = compareVersions(params['VERSION'], '1.3') >= 0;
  params[v13 ? 'CRS' : 'SRS'] = projection.getCode();
  const bbox =
    v13 && axisOrientation.startsWith('ne')
      ? [extent[1], extent[0], extent[3], extent[2]]
      : extent;
  params['BBOX'] = bbox.join(',');

  return appendParams(baseUrl, params);
}

/**
 * @param {import("../extent").Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio pixel ratio.
 * @param {import("../proj.js").Projection} projection Projection.
 * @param {string} url WMS service url.
 * @param {Object} params WMS params.
 * @param {import("./wms.js").ServerType} serverType The type of the remote WMS server.
 * @return {string} Image src.
 */
export function getImageSrc(
  extent,
  resolution,
  pixelRatio,
  projection,
  url,
  params,
  serverType,
) {
  params = Object.assign({REQUEST: 'GetMap'}, params);

  const imageResolution = resolution / pixelRatio;

  const imageSize = [
    round(getWidth(extent) / imageResolution, DECIMALS),
    round(getHeight(extent) / imageResolution, DECIMALS),
  ];

  if (pixelRatio != 1) {
    switch (serverType) {
      case 'geoserver':
        const dpi = (90 * pixelRatio + 0.5) | 0;
        if ('FORMAT_OPTIONS' in params) {
          params['FORMAT_OPTIONS'] += ';dpi:' + dpi;
        } else {
          params['FORMAT_OPTIONS'] = 'dpi:' + dpi;
        }
        break;
      case 'mapserver':
        params['MAP_RESOLUTION'] = 90 * pixelRatio;
        break;
      case 'carmentaserver':
      case 'qgis':
        params['DPI'] = 90 * pixelRatio;
        break;
      default:
        throw new Error('Unknown `serverType` configured');
    }
  }

  const src = getRequestUrl(url, extent, imageSize, projection, params);
  return src;
}

/**
 * @param {Object} params WMS params.
 * @param {string} request WMS `REQUEST`.
 * @return {Object} WMS params with required properties set.
 */
export function getRequestParams(params, request) {
  return Object.assign(
    {
      'REQUEST': request,
      'SERVICE': 'WMS',
      'VERSION': DEFAULT_VERSION,
      'FORMAT': 'image/png',
      'STYLES': '',
      'TRANSPARENT': 'TRUE',
    },
    params,
  );
}

/**
 * @typedef {Object} LoaderOptions
 * @property {null|string} [crossOrigin] The `crossOrigin` attribute for loaded images.  Note that
 * you must provide a `crossOrigin` value if you want to access pixel data with the Canvas renderer.
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
 * @property {boolean} [hidpi=true] Use the `ol/Map#pixelRatio` value when requesting
 * the image from the remote server.
 * @property {Object<string,*>} [params] WMS request parameters.
 * At least a `LAYERS` param is required. `STYLES` is
 * `''` by default. `VERSION` is `1.3.0` by default. `WIDTH`, `HEIGHT` and `BBOX` will be set
 * dynamically. `CRS` (`SRS` for WMS version < 1.3.0) will is derived from the `proection` config.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection. Default is 'EPSG:3857'.
 * @property {number} [ratio=1.5] Ratio. `1` means image requests are the size of the map viewport, `2` means
 * twice the width and height of the map viewport, and so on. Must be `1` or higher.
 * @property {import("./wms.js").ServerType} [serverType] The type of
 * the remote WMS server: `mapserver`, `geoserver`, `carmentaserver`, or `qgis`.
 * Only needed if `hidpi` is `true`.
 * @property {string} url WMS service URL.
 * @property {function(HTMLImageElement, string): Promise<import('../DataTile.js').ImageLike>} [load] Function
 * to perform loading of the image. Receives the created `HTMLImageElement` and the desired `src` as argument and
 * returns a promise resolving to the loaded or decoded image. Default is {@link module:ol/Image.decode}.
 */

/**
 * Creates a loader for WMS images.
 * @param {LoaderOptions} options Loader options.
 * @return {import("../Image.js").ImageObjectPromiseLoader} Loader.
 * @api
 */
export function createLoader(options) {
  const hidpi = options.hidpi === undefined ? true : options.hidpi;
  const projection = getProjection(options.projection || 'EPSG:3857');
  const ratio = options.ratio || 1.5;
  const load = options.load || decode;
  const crossOrigin = options.crossOrigin ?? null;

  return (extent, resolution, pixelRatio) => {
    extent = getRequestExtent(extent, resolution, pixelRatio, ratio);
    if (pixelRatio != 1 && (!hidpi || options.serverType === undefined)) {
      pixelRatio = 1;
    }
    const src = getImageSrc(
      extent,
      resolution,
      pixelRatio,
      projection,
      options.url,
      getRequestParams(options.params, 'GetMap'),
      options.serverType,
    );
    const image = new Image();
    image.crossOrigin = crossOrigin;
    return load(image, src).then((image) => ({image, extent, pixelRatio}));
  };
}

/**
 * Get the GetFeatureInfo URL for the passed coordinate and resolution. Returns `undefined` if the
 * GetFeatureInfo URL cannot be constructed.
 * @param {LoaderOptions} options Options passed the `createWMSLoader()` function. In addition to
 * the params required by the loader, `INFO_FORMAT` should be specified, it defaults to
 * `application/json`. If `QUERY_LAYERS` is not provided, then the layers specified in the `LAYERS`
 * parameter will be used.
 * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
 * @param {number} resolution Resolution.
 * @return {string|undefined} GetFeatureInfo URL.
 * @api
 */
export function getFeatureInfoUrl(options, coordinate, resolution) {
  if (options.url === undefined) {
    return undefined;
  }

  const projectionObj = getProjection(options.projection || 'EPSG:3857');

  const extent = getForViewAndSize(
    coordinate,
    resolution,
    0,
    GETFEATUREINFO_IMAGE_SIZE,
  );

  const baseParams = {
    'QUERY_LAYERS': options.params['LAYERS'],
    'INFO_FORMAT': 'application/json',
  };
  Object.assign(
    baseParams,
    getRequestParams(options.params, 'GetFeatureInfo'),
    options.params,
  );

  const x = floor((coordinate[0] - extent[0]) / resolution, DECIMALS);
  const y = floor((extent[3] - coordinate[1]) / resolution, DECIMALS);
  const v13 = compareVersions(baseParams['VERSION'], '1.3') >= 0;
  baseParams[v13 ? 'I' : 'X'] = x;
  baseParams[v13 ? 'J' : 'Y'] = y;

  return getRequestUrl(
    options.url,
    extent,
    GETFEATUREINFO_IMAGE_SIZE,
    projectionObj,
    baseParams,
  );
}

/**
 * Get the GetLegendGraphic URL, optionally optimized for the passed resolution and possibly
 * including any passed specific parameters. Returns `undefined` if the GetLegendGraphic URL
 * cannot be constructed.
 *
 * @param {LoaderOptions} options Options passed the `createWMSLoader()` function.
 * @param {number} [resolution] Resolution. If not provided, `SCALE` will not be calculated and
 * included in URL.
 * @return {string|undefined} GetLegendGraphic URL.
 * @api
 */
export function getLegendUrl(options, resolution) {
  if (options.url === undefined) {
    return undefined;
  }

  const baseParams = {
    'SERVICE': 'WMS',
    'VERSION': DEFAULT_VERSION,
    'REQUEST': 'GetLegendGraphic',
    'FORMAT': 'image/png',
  };

  if (resolution !== undefined) {
    const mpu =
      getProjection(options.projection || 'EPSG:3857').getMetersPerUnit() || 1;
    const pixelSize = 0.00028;
    baseParams['SCALE'] = (resolution * mpu) / pixelSize;
  }

  Object.assign(baseParams, options.params);

  if (options.params !== undefined && baseParams['LAYER'] === undefined) {
    const layers = baseParams['LAYERS'];
    const isSingleLayer = !Array.isArray(layers) || layers.length !== 1;
    if (!isSingleLayer) {
      return undefined;
    }
    baseParams['LAYER'] = layers;
  }

  return appendParams(options.url, baseParams);
}
