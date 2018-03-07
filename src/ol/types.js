/**
 * @module ol/types
 */


/**
 * An array of numbers representing an xy coordinate. Example: `[16, 48]`.
 * @typedef {Array.<number>} Coordinate
 * @api
 */

/**
 * Key to use with {@link module:ol/Observable~Observable#unByKey}.
 * @typedef {Object} EventsKey
 * @property {Object} [bindTo]
 * @property {ol.EventsListenerFunctionType} [boundListener]
 * @property {boolean} callOnce
 * @property {number} [deleteIndex]
 * @property {ol.EventsListenerFunctionType} listener
 * @property {EventTarget|ol.events.EventTarget} target
 * @property {string} type
 */

/**
 * An array of numbers representing an extent: `[minx, miny, maxx, maxy]`.
 * @typedef {Array.<number>} Extent
 * @api
 */

/**
 * @typedef {function(module:ol/PluggableMap~PluggableMap, ?olx.FrameState): boolean} PostRenderFunction
 */

/**
 * An array representing an affine 2d transformation for use with
 * {@link module:ol/transform} functions. The array has 6 elements.
 * @typedef {!Array.<number>} Transform
 */

