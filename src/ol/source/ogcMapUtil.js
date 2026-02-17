/**
 * @module ol/source/ogcMapUtil
 */

import {decode} from '../Image.js';
import {getHeight, getWidth} from '../extent.js';
import {round} from '../math.js';
import {get as getProjection} from '../proj.js';
import {appendParams} from '../uri.js';
import {getRequestExtent} from './Image.js';
import {DECIMALS} from './common.js';

/**
 * @param {string} baseUrl Base URL.
 * @param {import("../extent.js").Extent} extent Extent.
 * @param {import("../size.js").Size} size Size.
 * @param {import("../proj/Projection.js").default} projection Projection.
 * @param {Object} params OGC Map params. Will be modified in place.
 * @return {string} Request URL.
 */
export function getRequestUrl(baseUrl, extent, size, projection, params) {
  params['width'] = size[0];
  params['height'] = size[1];

  const axisOrientation = projection.getAxisOrientation();
  params['crs'] = projection.getCode();
  params['bbox-crs'] = projection.getCode();
  const bbox = axisOrientation.startsWith('ne')
    ? [extent[1], extent[0], extent[3], extent[2]]
    : extent;
  params['bbox'] = bbox.join(',');

  return appendParams(baseUrl, params);
}

/**
 * @param {import("../extent").Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio pixel ratio.
 * @param {import("../proj.js").Projection} projection Projection.
 * @param {string} url OGC Map service url.
 * @param {Object} params OGC Map params.
 * @return {string} Image src.
 */
export function getImageSrc(
  extent,
  resolution,
  pixelRatio,
  projection,
  url,
  params,
) {
  params = Object.assign({}, params);

  const imageResolution = resolution / pixelRatio;

  const imageSize = [
    round(getWidth(extent) / imageResolution, DECIMALS),
    round(getHeight(extent) / imageResolution, DECIMALS),
  ];

  if (pixelRatio !== 1) {
    params['mm-per-pixel'] = 0.28 / pixelRatio;
  }

  return getRequestUrl(url, extent, imageSize, projection, params);
}

/**
 * @typedef {Object} LoaderOptions
 * @property {null|string} [crossOrigin] The `crossOrigin` attribute for loaded images.  Note that
 * you must provide a `crossOrigin` value if you want to access pixel data with the Canvas renderer.
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
 * @property {ReferrerPolicy} [referrerPolicy] The `referrerPolicy` property for loaded images.
 * @property {boolean} [hidpi=true] Use the `ol/Map#pixelRatio` value when requesting
 * the image from the remote server.
 * @property {Object<string,*>} [params] OGC Map request parameters.
 * No param is required by default. `width`, `height`, `bbox`, `crs` and `bbox-crs` will be set dynamically.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection. Default is 'EPSG:3857'.
 * @property {number} [ratio=1.5] Ratio. `1` means image requests are the size of the map viewport, `2` means
 * twice the width and height of the map viewport, and so on. Must be `1` or higher.
 * @property {string} url OGC Map service URL.
 * @property {function(HTMLImageElement, string): Promise<import('../DataTile.js').ImageLike>} [load] Function
 * to perform loading of the image. Receives the created `HTMLImageElement` and the desired `src` as argument and
 * returns a promise resolving to the loaded or decoded image. Default is {@link module:ol/Image.decode}.
 */

/**
 * Creates a loader for OGC Map images.
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
    if (pixelRatio !== 1 && !hidpi) {
      pixelRatio = 1;
    }
    const src = getImageSrc(
      extent,
      resolution,
      pixelRatio,
      projection,
      options.url,
      options.params,
    );
    const image = new Image();
    image.crossOrigin = crossOrigin;
    if (options.referrerPolicy !== undefined) {
      image.referrerPolicy = options.referrerPolicy;
    }
    return load(image, src).then((image) => ({image, extent, pixelRatio}));
  };
}
