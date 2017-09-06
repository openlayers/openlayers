import _ol_color_ from './color';
var _ol_colorlike_ = {};


/**
 * @param {ol.Color|ol.ColorLike} color Color.
 * @return {ol.ColorLike} The color as an ol.ColorLike
 * @api
 */
_ol_colorlike_.asColorLike = function(color) {
  if (_ol_colorlike_.isColorLike(color)) {
    return /** @type {string|CanvasPattern|CanvasGradient} */ (color);
  } else {
    return _ol_color_.asString(/** @type {ol.Color} */ (color));
  }
};


/**
 * @param {?} color The value that is potentially an ol.ColorLike
 * @return {boolean} Whether the color is an ol.ColorLike
 */
_ol_colorlike_.isColorLike = function(color) {
  return (
    typeof color === 'string' ||
    color instanceof CanvasPattern ||
    color instanceof CanvasGradient
  );
};
export default _ol_colorlike_;
