goog.provide('ol.expression.Expression');
goog.provide('ol.expression.Identifier');
goog.provide('ol.expression.Literal');
goog.provide('ol.expression.Not');


/**
 * Support an extremely limited subset of ECMAScript 5.1
 * http://www.ecma-international.org/ecma-262/5.1/
 *
 * Inspired by Esprima (https://github.com/ariya/esprima)
 * BSD Licensed
 */



/**
 * @constructor
 */
ol.expression.Expression = function() {};


/**
 * Evaluate the expression and return the result.
 *
 * @param {Object} scope Evaluation scope.  All properties of this object
 *     will be available as variables when evaluating the expression.
 * @return {*} Result of the expression.
 */
ol.expression.Expression.prototype.evaluate = goog.abstractMethod;



/**
 * An identifier expression (e.g. `foo`).
 *
 * @constructor
 * @extends {ol.expression.Expression}
 * @param {string} name An identifier name.
 */
ol.expression.Identifier = function(name) {

  /**
   * @type {string}
   * @private
   */
  this.name_ = name;

};
goog.inherits(ol.expression.Identifier, ol.expression.Expression);


/**
 * @inheritDoc
 */
ol.expression.Identifier.prototype.evaluate = function(scope) {
  return scope[this.name_];
};



/**
 * A literal expression (e.g. `"chicken"`, `42`, `true`, `null`).
 *
 * @constructor
 * @extends {ol.expression.Expression}
 * @param {string|number|boolean|null} value A literal value.
 */
ol.expression.Literal = function(value) {

  /**
   * @type {string|number|boolean|null}
   * @private
   */
  this.value_ = value;

};
goog.inherits(ol.expression.Literal, ol.expression.Expression);


/**
 * @inheritDoc
 */
ol.expression.Literal.prototype.evaluate = function(scope) {
  return this.value_;
};



/**
 * A logical not expression (e.g. `!foo`).
 *
 * @constructor
 * @extends {ol.expression.Expression}
 * @param {ol.expression.Expression} expr Expression to negate.
 */
ol.expression.Not = function(expr) {

  /**
   * @type {ol.expression.Expression}
   * @private
   */
  this.expr_ = expr;

};
goog.inherits(ol.expression.Not, ol.expression.Expression);


/**
 * @inheritDoc
 */
ol.expression.Not.prototype.evaluate = function(scope) {
  return !this.expr_.evaluate(scope);
};

