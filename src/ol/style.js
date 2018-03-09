/**
 * @module ol/style
 */


/**
 * A function that takes an {@link module:ol/Feature~Feature} and a `{number}`
 * representing the view's resolution. The function should return a
 * {@link module:ol/style/Style~Style} or an array of them. This way e.g. a
 * vector layer can be styled.
 *
 * @typedef {function((module:ol/Feature~Feature|module:ol/render/Feature~Feature), number):
 *     (module:ol/style/Style~Style|Array.<module:ol/style/Style~Style>)} StyleFunction
 * @api
 */


import IconImageCache from './style/IconImageCache.js';

/**
 * The {@link module:ol/style/IconImageCache~IconImageCache} for
 * {@link module:ol/style/Icon~Icon} images.
 * @api
 */
export const iconImageCache = new IconImageCache();
