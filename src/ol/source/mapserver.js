/**
 * @module ol/source/mapserver
 */

import {decode} from '../Image.js';
import {getHeight, getWidth} from '../extent.js';
import {appendParams} from '../uri.js';
import {getRequestExtent} from './Image.js';

/**
 * @typedef {Object} LoaderOptions
 * @property {string} url The MapServer url.
 * @property {null|string} [crossOrigin] The `crossOrigin` attribute for loaded images.  Note that
 * you must provide a `crossOrigin` value if you want to access pixel data with the Canvas renderer.
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
 * the image from the remote server.
 * @property {number} [ratio=1] Ratio. `1` means image requests are the size of the map viewport, `2` means
 * twice the width and height of the map viewport, and so on. Must be `1` or higher.
 * @property {Object} [params] Additional query parameters.
 * @property {function(HTMLImageElement, string): Promise<import('../DataTile.js').ImageLike>} [load] Function
 * to perform loading of the image. Receives the created `HTMLImageElement` and the desired `src` as argument and
 * returns a promise resolving to the loaded or decoded image. Default is {@link module:ol/Image.decode}.
 */

/**
 * @param {string} baseUrl The MapServer url.
 * @param {Object<string, string|number>} params Request parameters.
 * @param {import("../extent.js").Extent} extent Extent.
 * @param {import("../size.js").Size} size Size.
 * @return {string} The MapServer map image request URL.
 */
function getUrl(baseUrl, params, extent, size) {
  const width = Math.round(size[0]);
  const height = Math.round(size[1]);
  const mapSize = `${width} ${height}`;
  const mapExt = `${extent[0]} ${extent[1]} ${extent[2]} ${extent[3]}`;

  const baseParams = {
    mode: 'map',
    map_imagetype: 'png',
    mapext: mapExt,
    imgext: mapExt,
    map_size: mapSize,
    imgx: width / 2,
    imgy: height / 2,
    imgxy: mapSize,
  };
  Object.assign(baseParams, params);
  return appendParams(baseUrl, baseParams);
}

/**
 * Creates a loader for MapServer images generated using the CGI interface,
 * which predates OGC services. It is **strongly** recommended to configure
 * MapServer to use WMS, and use the WMS createLoader.
 * @param {LoaderOptions} options LoaderOptions Options.
 * @return {import('../Image.js').ImageObjectPromiseLoader} MapServer image.
 * @api
 */
export function createLoader(options) {
  const load = options.load || decode;
  const ratio = options.ratio ?? 1;
  const crossOrigin = options.crossOrigin ?? null;

  /** @type {import('../Image.js').ImageObjectPromiseLoader} */
  return function (extent, resolution, pixelRatio) {
    const image = new Image();
    image.crossOrigin = crossOrigin;
    extent = getRequestExtent(extent, resolution, pixelRatio, ratio);
    const width = getWidth(extent) / resolution;
    const height = getHeight(extent) / resolution;
    const size = [width * pixelRatio, height * pixelRatio];
    const src = getUrl(options.url, options.params, extent, size);
    return load(image, src).then((image) => ({image, extent, pixelRatio}));
  };
}
