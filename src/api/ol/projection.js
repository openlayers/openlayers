goog.provide('ol.projection');

goog.require('ol.Projection');


/**
 * @typedef {ol.Projection|string}
 */
ol.ProjectionLike;


/**
 * @export
 * @param {ol.ProjectionLike=} opt_arg Argument.
 * @return {ol.Projection} Projection.
 */
ol.projection = function(opt_arg) {
  var code;
  if (arguments.length == 1) {
    if (opt_arg instanceof ol.Projection) {
      return opt_arg;
    } else if (goog.isString(arguments[0])) {
      code = arguments[0];
    } else {
      throw new Error('ol.projection');
    }
  }
  return new ol.Projection(code);
};


/**
 * @export
 * @param {string=} opt_code Code.
 * @return {ol.Projection|string} Result.
 */
ol.Projection.prototype.code = function(opt_code) {
  if (goog.isDef(opt_code)) {
    return this.setCode(opt_code);
  } else {
    return this.getCode();
  }
};
