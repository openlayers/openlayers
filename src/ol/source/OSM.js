/**
 * @module ol/source/OSM
 */
import {inherits} from '../util.js';
import XYZ from '../source/XYZ.js';


/**
 * The attribution containing a link to the OpenStreetMap Copyright and License
 * page.
 * @const
 * @type {string}
 * @api
 */
export const ATTRIBUTION = '&copy; ' +
      '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
      'contributors.';


/**
 * @typedef {Object} Options
 * @property {module:ol/source/Source~AttributionLike} [attributions] Attributions.
 * @property {number} [cacheSize=2048] Cache size.
 * @property {null|string} [crossOrigin] The `crossOrigin` attribute for loaded images.  Note that
 * you must provide a `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image} for more detail.
 * @property {number} [maxZoom=19] Max zoom.
 * @property {boolean} [opaque=true] Whether the layer is opaque.
 * @property {number} [reprojectionErrorThreshold=1.5] Maximum allowed reprojection error (in pixels).
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {module:ol/Tile~LoadFunction} [tileLoadFunction] Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @property {string} [url='https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'] URL template.
 * Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * @property {boolean} [wrapX=true] Whether to wrap the world horizontally.
 */


/**
 * @classdesc
 * Layer source for the OpenStreetMap tile server.
 *
 * @constructor
 * @extends {module:ol/source/XYZ}
 * @param {module:ol/source/OSM~Options=} [opt_options] Open Street Map options.
 * @api
 */
const OSM = function(opt_options) {

  const options = opt_options || {};

  let attributions;
  if (options.attributions !== undefined) {
    attributions = options.attributions;
  } else {
    attributions = [ATTRIBUTION];
  }

  const crossOrigin = options.crossOrigin !== undefined ?
    options.crossOrigin : 'anonymous';

  const url = options.url !== undefined ?
    options.url : 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  XYZ.call(this, {
    attributions: attributions,
    cacheSize: options.cacheSize,
    crossOrigin: crossOrigin,
    opaque: options.opaque !== undefined ? options.opaque : true,
    maxZoom: options.maxZoom !== undefined ? options.maxZoom : 19,
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    tileLoadFunction: options.tileLoadFunction,
    url: url,
    wrapX: options.wrapX
  });

};

inherits(OSM, XYZ);

export default OSM;
