goog.provide('ol.filter.Logical');
goog.provide('ol.filter.LogicalOperator');
goog.provide('ol.filter.and');
goog.provide('ol.filter.not');
goog.provide('ol.filter.or');

goog.require('goog.asserts');
goog.require('ol.filter.Filter');



/**
 * @constructor
 * @extends {ol.filter.Filter}
 * @param {Array.<ol.filter.Filter>} filters Filters to and-combine.
 * @param {ol.filter.LogicalOperator} operator Operator.
 */
ol.filter.Logical = function(filters, operator) {
  goog.base(this);

  /**
   * @type {Array.<ol.filter.Filter>}
   * @private
   */
  this.filters_ = filters;
  goog.asserts.assert(filters.length > 0, 'Must supply at least one filter');

  /**
   * @type {ol.filter.LogicalOperator}
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
      result;
  switch (this.operator) {
    case ol.filter.LogicalOperator.AND:
      result = true;
      while (result && i < ii) {
        result = result && filters[i].applies(feature);
        ++i;
      }
      break;
    case ol.filter.LogicalOperator.OR:
      result = false;
      while (!result && i < ii) {
        result = result || filters[i].applies(feature);
        ++i;
      }
      break;
    case ol.filter.LogicalOperator.NOT:
      result = !filters[i].applies(feature);
      break;
    default:
      goog.asserts.assert(false, 'Unsupported operation: ' + this.operator);
  }
  return !!result;
};


/**
 * @return {Array.<ol.filter.Filter>} The filter's filters.
 */
ol.filter.Logical.prototype.getFilters = function() {
  return this.filters_;
};


/**
 * @enum {string}
 */
ol.filter.LogicalOperator = {
  AND: '&&',
  OR: '||',
  NOT: '!'
};


/**
 * Create a filter that evaluates to true if all of the provided filters
 * evaluate to true.
 * @param {...ol.filter.Filter} var_filters Filters.
 * @return {ol.filter.Logical} A logical AND filter.
 */
ol.filter.and = function(var_filters) {
  var filters = Array.prototype.slice.call(arguments);
  return new ol.filter.Logical(filters, ol.filter.LogicalOperator.AND);
};


/**
 * Create a new filter that is the logical compliment of another.
 * @param {ol.filter.Filter} filter The filter to negate.
 * @return {ol.filter.Logical} A logical NOT filter.
 */
ol.filter.not = function(filter) {
  return new ol.filter.Logical([filter], ol.filter.LogicalOperator.NOT);
};


/**
 * Create a filter that evaluates to true if any of the provided filters
 * evaluate to true.
 * @param {...ol.filter.Filter} var_filters Filters.
 * @return {ol.filter.Logical} A logical OR filter.
 */
ol.filter.or = function(var_filters) {
  var filters = Array.prototype.slice.call(arguments);
  return new ol.filter.Logical(filters, ol.filter.LogicalOperator.OR);
};
