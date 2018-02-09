/**
 * @module ol/coverage/geotiff
 */


/**
 * @private
 * @type {GeoTIFF}
 */
let cache = null;


/**
 * Store the GeoTIFF function.
 * @param {GeoTIFF} geotiff The GeoTIFF function.
 */
export function set(geotiff) {
  cache = geotiff;
}


/**
 * Get the GeoTIFF lib.
 * @return {GeoTIFF} The GeoTIFF function set above or available globally.
 */
export function get() {
  return cache || window['GeoTIFF'];
}
