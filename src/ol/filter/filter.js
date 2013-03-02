goog.provide('ol.filter.Filter');

goog.require('ol.Feature');



/**
 * @interface
 */
ol.filter.Filter = function() {};


/**
 * @param {ol.Feature} feature Feature to evaluate.
 * @return {boolean} The provided feature passes this filter.
 */
ol.filter.Filter.prototype.applies = function(feature) {};
