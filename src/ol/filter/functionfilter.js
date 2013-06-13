goog.provide('ol.filter.Function');

goog.require('ol.filter.Filter');



/**
 * @constructor
 * @extends {ol.filter.Filter}
 * @param {ol.filter.FunctionOptions} options The options to set on this
 *     instance.
 */
ol.filter.Function = function(options) {
  goog.base(this);

  /**
   * @type {string}
   * @private
   */
  this.name_ = options.name;

  /**
   * @type {Array.<ol.filter.Function|string|number>}
   * @private
   */
  this.params_ = options.params;

};
goog.inherits(ol.filter.Function, ol.filter.Filter);


/**
 * @return {Array.<ol.filter.Function|string|number>} The parameters
 *     of this filter function.
 */
ol.filter.Function.prototype.getParams = function() {
  return this.params_;
};


/**
 * @return {string} The name of the function.
 */
ol.filter.Function.prototype.getName = function() {
  return this.name_;
};
