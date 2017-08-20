/**
 * @type {Object}
 */
var common;



/**
 * @param {string=} opt_default Default renderer.
 * @return {string} Renderer type.
 */
common.getRendererFromQueryString = function(opt_default) {};


/**
 * @param {function(new:ol.style.Style, olx.style.StyleOptions=)} Style Style constructor.
 * @param {function(new:ol.style.Fill, olx.style.FillOptions=)} Fill Fill constructor.
 * @param {function(new:ol.style.Stroke, olx.style.StrokeOptions=)} Stroke Stroke constructor.
 * @param {function(new:ol.style.Icon, olx.style.IconOptions=)} Icon Icon constructor.
 * @param {function(new:ol.style.Text, olx.style.TextOptions=)} Text Text constructor.
 * @return {function((ol.Feature|ol.render.Feature), number):
 *     Array.<ol.style.Style>}
 */
var createMapboxStreetsV6Style = function(Style, Fill, Stroke, Icon, Text) {};
