goog.provide('ol.filter.Filter');

goog.require('ol.Feature');



/**
 * @constructor
 * @param {function(this:ol.filter.Filter, ol.Feature)=} opt_filterFunction
 *     Filter function. Should return true if the passed feature passes the
 *     filter, false otherwise.
 */
ol.filter.Filter = function(opt_filterFunction) {
  if (goog.isDef(opt_filterFunction)) {
    this.applies = opt_filterFunction;
  }
};


/**
 * @param {ol.Feature} feature Feature to evaluate the filter against.
 * @return {boolean} The provided feature passes this filter.
 */
ol.filter.Filter.prototype.applies = goog.abstractMethod;
