goog.provide('ol.filter.Logical');
goog.provide('ol.filter.LogicalOperator');

goog.require('ol.filter.Filter');



/**
 * @constructor
 * @extends {ol.filter.Filter}
 * @param {Array.<ol.filter.Filter>} filters Filters to and-combine.
 * @param {!ol.filter.LogicalOperator} operator Operator.
 */
ol.filter.Logical = function(filters, operator) {
  goog.base(this);

  /**
   * @type {Array.<ol.filter.Filter>}
   * @private
   */
  this.filters_ = filters;

  /**
   * @type {!ol.filter.LogicalOperator}
   */
  this.operator = operator;

};
goog.inherits(ol.filter.Logical, ol.filter.Filter);


/**
 * @inheritDoc
 */
ol.filter.Logical.prototype.applies = function(feature) {
  var filters = this.filters_,
      i = 0, ii = filters.length,
      operator = this.operator,
      start = operator(true, false),
      result = start;
  while (result === start && i < ii) {
    result = operator(result, filters[i].applies(feature));
    ++i;
  }
  return result;
};


/**
 * @return {Array.<ol.filter.Filter>} The filter's filters.
 */
ol.filter.Logical.prototype.getFilters = function() {
  return this.filters_;
};


/**
 * @enum {!Function}
 */
ol.filter.LogicalOperator = {
  AND: /** @return {boolean} result. */ function(a, b) { return a && b; },
  OR: /** @return {boolean} result. */ function(a, b) { return a || b; }
};
