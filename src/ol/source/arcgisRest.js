/**
 * @module ol/source/arcgisRest
 */

import {DECIMALS} from './common.js';
import {appendParams} from '../uri.js';
import {decode} from '../Image.js';
import {getHeight, getWidth} from '../extent.js';
import {get as getProjection} from '../proj.js';
import {getRequestExtent} from './Image.js';
import {round} from '../math.js';

/**
 * @param {string} baseUrl Base URL for the ArcGIS Rest service.
 * @param {import("../extent.js").Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {import("../proj/Projection.js").default} projection Projection.
 * @param {Object} params Params.
 * @return {string} Request URL.
 */
export function getRequestUrl(
  baseUrl,
  extent,
  resolution,
  pixelRatio,
  projection,
  params,
) {
  // ArcGIS Server only wants the numeric portion of the projection ID.
  // (if there is no numeric portion the entire projection code must
  // form a valid ArcGIS SpatialReference definition).
  const srid = projection
    .getCode()
    .split(/:(?=\d+$)/)
    .pop();

  const imageResolution = resolution / pixelRatio;

  const imageSize = [
    round(getWidth(extent) / imageResolution, DECIMALS),
    round(getHeight(extent) / imageResolution, DECIMALS),
  ];

  params['SIZE'] = imageSize[0] + ',' + imageSize[1];
  params['BBOX'] = extent.join(',');
  params['BBOXSR'] = srid;
  params['IMAGESR'] = srid;
  params['DPI'] = Math.round(
    params['DPI'] ? params['DPI'] * pixelRatio : 90 * pixelRatio,
  );

  const modifiedUrl = baseUrl
    .replace(/MapServer\/?$/, 'MapServer/export')
    .replace(/ImageServer\/?$/, 'ImageServer/exportImage');
  return appendParams(modifiedUrl, params);
}

/**
 * @typedef {Object} LoaderOptions
 * @property {null|string} [crossOrigin] The `crossOrigin` attribute for loaded images.  Note that
 * you must provide a `crossOrigin` value if you want to access pixel data with the Canvas renderer.
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
 * @property {boolean} [hidpi=true] Use the `ol/Map#pixelRatio` value when requesting the image from
 * the remote server.
 * @property {Object<string,*>} [params] ArcGIS Rest parameters. This field is optional. Service
 * defaults will be used for any fields not specified. `FORMAT` is `PNG32` by default. `F` is
 * `IMAGE` by default. `TRANSPARENT` is `true` by default.  `BBOX`, `SIZE`, `BBOXSR`, and `IMAGESR`
 * will be set dynamically. Set `LAYERS` to override the default service layer visibility. See
 * https://developers.arcgis.com/rest/services-reference/export-map.htm
 * for further reference.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection. Default is 'EPSG:3857'.
 * The projection code must contain a numeric end portion separated by :
 * or the entire code must form a valid ArcGIS SpatialReference definition.
 * @property {number} [ratio=1.5] Ratio. `1` means image requests are the size of the map viewport,
 * `2` means twice the size of the map viewport, and so on.
 * @property {string} [url] ArcGIS Rest service URL for a Map Service or Image Service. The url
 * should include /MapServer or /ImageServer.
 * @property {function(HTMLImageElement, string): Promise<import('../DataTile.js').ImageLike>} [load] Function
 * to perform loading of the image. Receives the created `HTMLImageElement` and the desired `src` as argument and
 * returns a promise resolving to the loaded or decoded image. Default is {@link module:ol/Image.decode}.
 */

/**
 * Creates a loader for ArcGIS Rest images.
 * @param {LoaderOptions} options Image ArcGIS Rest Options.
 * @return {import('../Image.js').ImageObjectPromiseLoader} ArcGIS Rest image.
 * @api
 */
export function createLoader(options) {
  const load = options.load ? options.load : decode;
  const projection = getProjection(options.projection || 'EPSG:3857');

  /** @type {import('../Image.js').ImageObjectPromiseLoader} */
  return function (extent, resolution, pixelRatio) {
    pixelRatio = options.hidpi ? pixelRatio : 1;

    const params = {
      'F': 'image',
      'FORMAT': 'PNG32',
      'TRANSPARENT': true,
    };
    Object.assign(params, options.params);

    extent = getRequestExtent(extent, resolution, pixelRatio, options.ratio);

    const src = getRequestUrl(
      options.url,
      extent,
      resolution,
      pixelRatio,
      projection,
      params,
    );

    const image = new Image();
    if (options.crossOrigin !== null) {
      image.crossOrigin = options.crossOrigin;
    }

    return load(image, src).then((image) => {
      // Update resolution, because the server may return a smaller size than requested
      const resolution = (getWidth(extent) / image.width) * pixelRatio;
      return {image, extent, resolution, pixelRatio};
    });
  };
}
