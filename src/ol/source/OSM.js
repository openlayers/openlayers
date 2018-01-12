/**
 * @module ol/source/OSM
 */
import {inherits} from '../index.js';
import XYZ from '../source/XYZ.js';

/**
 * @classdesc
 * Layer source for the OpenStreetMap tile server.
 *
 * @constructor
 * @extends {ol.source.XYZ}
 * @param {olx.source.OSMOptions=} opt_options Open Street Map options.
 * @api
 */
const OSM = function(opt_options) {

  const options = opt_options || {};

  let attributions;
  if (options.attributions !== undefined) {
    attributions = options.attributions;
  } else {
    attributions = [OSM.ATTRIBUTION];
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


/**
 * The attribution containing a link to the OpenStreetMap Copyright and License
 * page.
 * @const
 * @type {string}
 * @api
 */
OSM.ATTRIBUTION = '&copy; ' +
      '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
      'contributors.';
export default OSM;
