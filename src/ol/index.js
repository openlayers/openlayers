/**
 * @module ol
 */

export {default as Collection} from './Collection.js';
export {default as Feature} from './Feature.js';
export {default as Geolocation} from './Geolocation.js';
export {default as Graticule} from './Graticule.js';
export {default as Kinetic} from './Kinetic.js';
export {default as Map} from './Map.js';
export {default as Observable} from './Observable.js';
export {default as Overlay} from './Overlay.js';
export {default as PluggableMap} from './PluggableMap.js';
export {default as View} from './View.js';
export {default as WebGLMap} from './WebGLMap.js';

export {getUid, inherits, VERSION} from './util.js';

/**
 * An array with two elements, representing a pixel. The first element is the
 * x-coordinate, the second the y-coordinate of the pixel.
 * @typedef {Array.<number>} Pixel
 * @api
 */
