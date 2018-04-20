/**
 * @type {Object}
 */
let common;


/**
 * @param {string=} opt_default Default renderer.
 * @return {string} Renderer type.
 */
common.getRendererFromQueryString = function(opt_default) {};


/**
 * @param {function(new:ol.style.Style, module:ol/style/Style~Options=)} Style Style constructor.
 * @param {function(new:ol.style.Fill, module:ol/style/Fill~Options=)} Fill Fill constructor.
 * @param {function(new:ol.style.Stroke, module:ol/style/Stroke~Options=)} Stroke Stroke constructor.
 * @param {function(new:ol.style.Icon, module:ol/style/Icon~Options=)} Icon Icon constructor.
 * @param {function(new:ol.style.Text, module:ol/style/Text~Options=)} Text Text constructor.
 * @return {function((module:ol/Feature~Feature|ol.render.Feature), number):
 *     Array.<ol.style.Style>}
 */
const createMapboxStreetsV6Style = function(Style, Fill, Stroke, Icon, Text) {};
