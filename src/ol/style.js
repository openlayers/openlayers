/**
 * @module ol/style
 */


/**
 * A function that takes an {@link module:ol/Feature} and a `{number}`
 * representing the view's resolution. The function should return a
 * {@link module:ol/style/Style} or an array of them. This way e.g. a
 * vector layer can be styled.
 *
 * @typedef {function((module:ol/Feature|module:ol/render/Feature~Feature), number):
 *     (module:ol/style/Style|Array.<module:ol/style/Style>)} StyleFunction
 * @api
 */

export {default as Atlas} from './style/Atlas.js';
export {default as AtlasManager} from './style/AtlasManager.js';
export {default as Circle} from './style/Circle.js';
export {default as Fill} from './style/Fill.js';
export {default as Icon} from './style/Icon.js';
export {default as IconImage} from './style/IconImage.js';
export {default as Image} from './style/Image.js';
export {default as RegularShape} from './style/RegularShape.js';
export {default as Stroke} from './style/Stroke.js';
export {default as Style} from './style/Style.js';
export {default as Text} from './style/Text.js';
