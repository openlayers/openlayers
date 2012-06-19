goog.provide('ol.map');

goog.require('ol.Location');
goog.require('ol.Map');
goog.require('ol.Projection');


/**
 * @typedef {ol.Map|Object|string}
 */
ol.MapLike;


/**
 * @param {ol.MapLike=} opt_arg Argument.
 * @return {ol.Map} Map.
 */
ol.map = function(opt_arg) {

  /** @type {ol.Location|undefined} */
  var center;
  var target;

  if (arguments.length == 1) {
    if (opt_arg instanceof ol.Map) {
      return opt_arg;
    } else if (goog.isObject(opt_arg)) {
      config = opt_arg;
      if (goog.isDef(config.center)) {
        center = ol.loc(config.center);
      }
      if (goog.isDef(config.target)) {
        target = config.target;
      }
    } else {
      throw new Error('ol.map');
    }
  }

  var map = new ol.Map();

  return map;

};
