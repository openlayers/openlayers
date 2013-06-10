goog.provide('ol.expression.BooleanLiteral');
goog.provide('ol.expression.Expression');
goog.provide('ol.expression.Identifier');
goog.provide('ol.expression.Not');
goog.provide('ol.expression.NullLiteral');
goog.provide('ol.expression.NumericLiteral');
goog.provide('ol.expression.StringLiteral');


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
 * @return {string|number|boolean|null} Result of the expression.
 */
ol.expression.Expression.prototype.evaluate = goog.abstractMethod;



/**
 * A boolean literal expression (e.g. `true`).
 *
 * @constructor
 * @extends {ol.expression.Expression}
 * @param {boolean} value A boolean value.
 */
ol.expression.BooleanLiteral = function(value) {

  /**
   * @type {boolean}
   * @private
   */
  this.value_ = value;

};
goog.inherits(ol.expression.BooleanLiteral, ol.expression.Expression);


/**
 * @inheritDoc
 */
ol.expression.BooleanLiteral.prototype.evaluate = function(scope) {
  return this.value_;
};



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



/**
 * A numeric literal expression (e.g. `42`).
 *
 * @constructor
 * @extends {ol.expression.Expression}
 * @param {number} value A numeric value.
 */
ol.expression.NumericLiteral = function(value) {

  /**
   * @type {number}
   * @private
   */
  this.value_ = value;

};
goog.inherits(ol.expression.NumericLiteral, ol.expression.Expression);


/**
 * @inheritDoc
 */
ol.expression.NumericLiteral.prototype.evaluate = function(scope) {
  return this.value_;
};



/**
 * A null literal expression (i.e. `null`).
 *
 * @constructor
 * @extends {ol.expression.Expression}
 */
ol.expression.NullLiteral = function() {
};
goog.inherits(ol.expression.NullLiteral, ol.expression.Expression);


/**
 * @inheritDoc
 */
ol.expression.NullLiteral.prototype.evaluate = function(scope) {
  return null;
};



/**
 * A string literal expression (e.g. `"chicken"`).
 *
 * @constructor
 * @extends {ol.expression.Expression}
 * @param {string} value A string.
 */
ol.expression.StringLiteral = function(value) {

  /**
   * @type {string}
   * @private
   */
  this.value_ = value;

};
goog.inherits(ol.expression.StringLiteral, ol.expression.Expression);


/**
 * @inheritDoc
 */
ol.expression.StringLiteral.prototype.evaluate = function(scope) {
  return this.value_;
};
