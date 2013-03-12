goog.provide('ol.Expression');
goog.provide('ol.ExpressionLiteral');



/**
 * @constructor
 * @param {string} source Expression to be evaluated.
 */
ol.Expression = function(source) {

  /**
   * @type {string}
   * @private
   */
  this.source_ = source;

};


/**
 * Evaluate the expression and return the result.
 *
 * @param {Object=} opt_thisArg Object to use as this when evaluating the
 *     expression.  If not provided, the global object will be used.
 * @param {Object=} opt_scope Evaluation scope.  All properties of this object
 *     will be available as variables when evaluating the expression.  If not
 *     provided, the global object will be used.
 * @return {*} Result of the expression.
 */
ol.Expression.prototype.evaluate = function(opt_thisArg, opt_scope) {
  var thisArg = goog.isDef(opt_thisArg) ? opt_thisArg : goog.global,
      scope = goog.isDef(opt_scope) ? opt_scope : goog.global,
      names = [],
      values = [];

  for (var name in scope) {
    names.push(name);
    values.push(scope[name]);
  }

  var evaluator = new Function(names.join(','), 'return ' + this.source_);
  return evaluator.apply(thisArg, values);
};



/**
 * @constructor
 * @extends {ol.Expression}
 * @param {*} value Literal value.
 */
ol.ExpressionLiteral = function(value) {

  /**
   * @type {*}
   * @private
   */
  this.value_ = value;

};
goog.inherits(ol.ExpressionLiteral, ol.Expression);


/**
 * @inheritDoc
 */
ol.ExpressionLiteral.prototype.evaluate = function(opt_thisArg, opt_scope) {
  return this.value_;
};
