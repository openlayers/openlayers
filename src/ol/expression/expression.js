goog.provide('ol.expression.Comparison');
goog.provide('ol.expression.ComparisonOp');
goog.provide('ol.expression.Expression');
goog.provide('ol.expression.Identifier');
goog.provide('ol.expression.Literal');
goog.provide('ol.expression.Math');
goog.provide('ol.expression.MathOp');
goog.provide('ol.expression.Not');



/**
 * Base class for all expressions.  Instances of ol.Expression correspond to
 * a limited set of ECMAScript 5.1 expressions.
 * http://www.ecma-international.org/ecma-262/5.1/#sec-11
 *
 * This base class should not be constructed directly.  Instead, use one of
 * the subclass constructors.
 *
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
 * @enum {string}
 */
ol.expression.ComparisonOp = {
  EQ: '==',
  NEQ: '!=',
  STRICT_EQ: '===',
  STRICT_NEQ: '!==',
  GT: '>',
  LT: '<',
  GTE: '>=',
  LTE: '<='
};



/**
 * A comparison expression (e.g. `foo >= 42`, `bar != "chicken"`).
 *
 * @constructor
 * @extends {ol.expression.Expression}
 * @param {ol.expression.ComparisonOp} operator Comparison operator.
 * @param {ol.expression.Expression} left Left expression.
 * @param {ol.expression.Expression} right Right expression.
 */
ol.expression.Comparison = function(operator, left, right) {

  /**
   * @type {ol.expression.ComparisonOp}
   * @private
   */
  this.operator_ = operator;

  /**
   * @type {ol.expression.Expression}
   * @private
   */
  this.left_ = left;

  /**
   * @type {ol.expression.Expression}
   * @private
   */
  this.right_ = right;

};
goog.inherits(ol.expression.Comparison, ol.expression.Expression);


/**
 * @inheritDoc
 */
ol.expression.Comparison.prototype.evaluate = function(scope) {
  var result;
  var rightVal = this.right_.evaluate(scope);
  var leftVal = this.left_.evaluate(scope);

  switch (this.operator_) {
    case ol.expression.ComparisonOp.EQ:
      result = leftVal == rightVal;
      break;
    case ol.expression.ComparisonOp.NEQ:
      result = leftVal != rightVal;
      break;
    case ol.expression.ComparisonOp.STRICT_EQ:
      result = leftVal === rightVal;
      break;
    case ol.expression.ComparisonOp.STRICT_NEQ:
      result = leftVal !== rightVal;
      break;
    case ol.expression.ComparisonOp.GT:
      result = leftVal > rightVal;
      break;
    case ol.expression.ComparisonOp.LT:
      result = leftVal < rightVal;
      break;
    case ol.expression.ComparisonOp.GTE:
      result = leftVal >= rightVal;
      break;
    case ol.expression.ComparisonOp.LTE:
      result = leftVal <= rightVal;
      break;
    default:
      throw new Error('Unsupported comparison operator: ' + this.operator_);
  }
  return result;
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
 * @enum {string}
 */
ol.expression.MathOp = {
  ADD: '+',
  SUBTRACT: '-',
  MULTIPLY: '*',
  DIVIDE: '/',
  MOD: '%'
};



/**
 * A math expression (e.g. `foo + 42`, `bar % 10`).
 *
 * @constructor
 * @extends {ol.expression.Expression}
 * @param {ol.expression.MathOp} operator Math operator.
 * @param {ol.expression.Expression} left Left expression.
 * @param {ol.expression.Expression} right Right expression.
 */
ol.expression.Math = function(operator, left, right) {

  /**
   * @type {ol.expression.MathOp}
   * @private
   */
  this.operator_ = operator;

  /**
   * @type {ol.expression.Expression}
   * @private
   */
  this.left_ = left;

  /**
   * @type {ol.expression.Expression}
   * @private
   */
  this.right_ = right;

};
goog.inherits(ol.expression.Math, ol.expression.Expression);


/**
 * @inheritDoc
 */
ol.expression.Math.prototype.evaluate = function(scope) {
  var result;
  var rightVal = this.right_.evaluate(scope);
  var leftVal = this.left_.evaluate(scope);
  /**
   * TODO: throw if rightVal, leftVal not numbers - this would require the use
   * of a concat function for strings but it would let us serialize these as
   * math functions where available elsewhere
   */

  switch (this.operator_) {
    case ol.expression.MathOp.ADD:
      result = leftVal + rightVal;
      break;
    case ol.expression.MathOp.SUBTRACT:
      result = Number(leftVal) - Number(rightVal);
      break;
    case ol.expression.MathOp.MULTIPLY:
      result = Number(leftVal) * Number(rightVal);
      break;
    case ol.expression.MathOp.DIVIDE:
      result = Number(leftVal) / Number(rightVal);
      break;
    case ol.expression.MathOp.MOD:
      result = Number(leftVal) % Number(rightVal);
      break;
    default:
      throw new Error('Unsupported math operator: ' + this.operator_);
  }
  return result;
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

