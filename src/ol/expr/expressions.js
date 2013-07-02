goog.provide('ol.expr.Call');
goog.provide('ol.expr.Comparison');
goog.provide('ol.expr.ComparisonOp');
goog.provide('ol.expr.Expression');
goog.provide('ol.expr.Identifier');
goog.provide('ol.expr.Literal');
goog.provide('ol.expr.Logical');
goog.provide('ol.expr.LogicalOp');
goog.provide('ol.expr.Math');
goog.provide('ol.expr.MathOp');
goog.provide('ol.expr.Member');
goog.provide('ol.expr.Not');



/**
 * Base class for all expressions.  Instances of ol.expr.Expression
 * correspond to a limited set of ECMAScript 5.1 expressions.
 * http://www.ecma-international.org/ecma-262/5.1/#sec-11
 *
 * This base class should not be constructed directly.  Instead, use one of
 * the subclass constructors.
 *
 * @constructor
 */
ol.expr.Expression = function() {};


/**
 * Evaluate the expression and return the result.
 *
 * @param {Object=} opt_scope Evaluation scope.  All properties of this object
 *     will be available as variables when evaluating the expression.  If not
 *     provided, `null` will be used.
 * @param {Object=} opt_fns Optional scope for looking up functions.  If not
 *     provided, functions will be looked in the evaluation scope.
 * @param {Object=} opt_this Object to use as this when evaluating call
 *     expressions.  If not provided, `this` will resolve to a new object.
 * @return {*} Result of the expression.
 */
ol.expr.Expression.prototype.evaluate = goog.abstractMethod;



/**
 * A call expression (e.g. `foo(bar)`).
 *
 * @constructor
 * @extends {ol.expr.Expression}
 * @param {ol.expr.Expression} callee An expression that resolves to a
 *     function.
 * @param {Array.<ol.expr.Expression>} args Arguments.
 */
ol.expr.Call = function(callee, args) {

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.callee_ = callee;

  /**
   * @type {Array.<ol.expr.Expression>}
   * @private
   */
  this.args_ = args;

};
goog.inherits(ol.expr.Call, ol.expr.Expression);


/**
 * @inheritDoc
 */
ol.expr.Call.prototype.evaluate = function(opt_scope, opt_fns, opt_this) {
  var fnScope = goog.isDefAndNotNull(opt_fns) ? opt_fns : opt_scope;
  var fn = this.callee_.evaluate(fnScope);
  if (!fn || !goog.isFunction(fn)) {
    throw new Error('Expected function but found ' + fn);
  }
  var thisArg = goog.isDef(opt_this) ? opt_this : {};

  var len = this.args_.length;
  var values = new Array(len);
  for (var i = 0; i < len; ++i) {
    values[i] = this.args_[i].evaluate(opt_scope, opt_fns, opt_this);
  }
  return fn.apply(thisArg, values);
};


/**
 * Get the argument list.
 * @return {Array.<ol.expr.Expression>} The argument.
 */
ol.expr.Call.prototype.getArgs = function() {
  return this.args_;
};


/**
 * Get the callee expression.
 * @return {ol.expr.Expression} The callee expression.
 */
ol.expr.Call.prototype.getCallee = function() {
  return this.callee_;
};


/**
 * @enum {string}
 */
ol.expr.ComparisonOp = {
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
 * @extends {ol.expr.Expression}
 * @param {ol.expr.ComparisonOp} operator Comparison operator.
 * @param {ol.expr.Expression} left Left expression.
 * @param {ol.expr.Expression} right Right expression.
 */
ol.expr.Comparison = function(operator, left, right) {

  /**
   * @type {ol.expr.ComparisonOp}
   * @private
   */
  this.operator_ = operator;

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.left_ = left;

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.right_ = right;

};
goog.inherits(ol.expr.Comparison, ol.expr.Expression);


/**
 * Determine if a given string is a valid comparison operator.
 * @param {string} candidate Operator to test.
 * @return {boolean} The operator is valid.
 */
ol.expr.Comparison.isValidOp = (function() {
  var valid = {};
  for (var key in ol.expr.ComparisonOp) {
    valid[ol.expr.ComparisonOp[key]] = true;
  }
  return function isValidOp(candidate) {
    return !!valid[candidate];
  };
}());


/**
 * @inheritDoc
 */
ol.expr.Comparison.prototype.evaluate = function(opt_scope, opt_fns, opt_this) {
  var result;
  var rightVal = this.right_.evaluate(opt_scope, opt_fns, opt_this);
  var leftVal = this.left_.evaluate(opt_scope, opt_fns, opt_this);

  var op = this.operator_;
  if (op === ol.expr.ComparisonOp.EQ) {
    result = leftVal == rightVal;
  } else if (op === ol.expr.ComparisonOp.NEQ) {
    result = leftVal != rightVal;
  } else if (op === ol.expr.ComparisonOp.STRICT_EQ) {
    result = leftVal === rightVal;
  } else if (op === ol.expr.ComparisonOp.STRICT_NEQ) {
    result = leftVal !== rightVal;
  } else if (op === ol.expr.ComparisonOp.GT) {
    result = leftVal > rightVal;
  } else if (op === ol.expr.ComparisonOp.LT) {
    result = leftVal < rightVal;
  } else if (op === ol.expr.ComparisonOp.GTE) {
    result = leftVal >= rightVal;
  } else if (op === ol.expr.ComparisonOp.LTE) {
    result = leftVal <= rightVal;
  } else {
    throw new Error('Unsupported comparison operator: ' + this.operator_);
  }
  return result;
};


/**
 * Get the comparison operator.
 * @return {string} The comparison operator.
 */
ol.expr.Comparison.prototype.getOperator = function() {
  return this.operator_;
};


/**
 * Get the left expression.
 * @return {ol.expr.Expression} The left expression.
 */
ol.expr.Comparison.prototype.getLeft = function() {
  return this.left_;
};


/**
 * Get the right expression.
 * @return {ol.expr.Expression} The right expression.
 */
ol.expr.Comparison.prototype.getRight = function() {
  return this.right_;
};



/**
 * An identifier expression (e.g. `foo`).
 *
 * @constructor
 * @extends {ol.expr.Expression}
 * @param {string} name An identifier name.
 */
ol.expr.Identifier = function(name) {

  /**
   * @type {string}
   * @private
   */
  this.name_ = name;

};
goog.inherits(ol.expr.Identifier, ol.expr.Expression);


/**
 * @inheritDoc
 */
ol.expr.Identifier.prototype.evaluate = function(opt_scope) {
  if (!goog.isDefAndNotNull(opt_scope)) {
    throw new Error('Attempt to evaluate identifier with no scope');
  }
  return opt_scope[this.name_];
};


/**
 * Get the identifier name.
 * @return {string} The identifier name.
 */
ol.expr.Identifier.prototype.getName = function() {
  return this.name_;
};



/**
 * A literal expression (e.g. `"chicken"`, `42`, `true`, `null`).
 *
 * @constructor
 * @extends {ol.expr.Expression}
 * @param {string|number|boolean|null} value A literal value.
 */
ol.expr.Literal = function(value) {

  /**
   * @type {string|number|boolean|null}
   * @private
   */
  this.value_ = value;

};
goog.inherits(ol.expr.Literal, ol.expr.Expression);


/**
 * @inheritDoc
 */
ol.expr.Literal.prototype.evaluate = function() {
  return this.value_;
};


/**
 * Get the literal value.
 * @return {string|number|boolean|null} The literal value.
 */
ol.expr.Literal.prototype.getValue = function() {
  return this.value_;
};


/**
 * @enum {string}
 */
ol.expr.LogicalOp = {
  AND: '&&',
  OR: '||'
};



/**
 * A binary logical expression (e.g. `foo && bar`, `bar || "chicken"`).
 *
 * @constructor
 * @extends {ol.expr.Expression}
 * @param {ol.expr.LogicalOp} operator Logical operator.
 * @param {ol.expr.Expression} left Left expression.
 * @param {ol.expr.Expression} right Right expression.
 */
ol.expr.Logical = function(operator, left, right) {

  /**
   * @type {ol.expr.LogicalOp}
   * @private
   */
  this.operator_ = operator;

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.left_ = left;

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.right_ = right;

};
goog.inherits(ol.expr.Logical, ol.expr.Expression);


/**
 * Determine if a given string is a valid logical operator.
 * @param {string} candidate Operator to test.
 * @return {boolean} The operator is valid.
 */
ol.expr.Logical.isValidOp = (function() {
  var valid = {};
  for (var key in ol.expr.LogicalOp) {
    valid[ol.expr.LogicalOp[key]] = true;
  }
  return function isValidOp(candidate) {
    return !!valid[candidate];
  };
}());


/**
 * @inheritDoc
 */
ol.expr.Logical.prototype.evaluate = function(opt_scope, opt_fns,
    opt_this) {
  var result;
  var rightVal = this.right_.evaluate(opt_scope, opt_fns, opt_this);
  var leftVal = this.left_.evaluate(opt_scope, opt_fns, opt_this);

  if (this.operator_ === ol.expr.LogicalOp.AND) {
    result = leftVal && rightVal;
  } else if (this.operator_ === ol.expr.LogicalOp.OR) {
    result = leftVal || rightVal;
  } else {
    throw new Error('Unsupported logical operator: ' + this.operator_);
  }
  return result;
};


/**
 * Get the logical operator.
 * @return {string} The logical operator.
 */
ol.expr.Logical.prototype.getOperator = function() {
  return this.operator_;
};


/**
 * Get the left expression.
 * @return {ol.expr.Expression} The left expression.
 */
ol.expr.Logical.prototype.getLeft = function() {
  return this.left_;
};


/**
 * Get the right expression.
 * @return {ol.expr.Expression} The right expression.
 */
ol.expr.Logical.prototype.getRight = function() {
  return this.right_;
};


/**
 * @enum {string}
 */
ol.expr.MathOp = {
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
 * @extends {ol.expr.Expression}
 * @param {ol.expr.MathOp} operator Math operator.
 * @param {ol.expr.Expression} left Left expression.
 * @param {ol.expr.Expression} right Right expression.
 */
ol.expr.Math = function(operator, left, right) {

  /**
   * @type {ol.expr.MathOp}
   * @private
   */
  this.operator_ = operator;

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.left_ = left;

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.right_ = right;

};
goog.inherits(ol.expr.Math, ol.expr.Expression);


/**
 * Determine if a given string is a valid math operator.
 * @param {string} candidate Operator to test.
 * @return {boolean} The operator is valid.
 */
ol.expr.Math.isValidOp = (function() {
  var valid = {};
  for (var key in ol.expr.MathOp) {
    valid[ol.expr.MathOp[key]] = true;
  }
  return function isValidOp(candidate) {
    return !!valid[candidate];
  };
}());


/**
 * @inheritDoc
 */
ol.expr.Math.prototype.evaluate = function(opt_scope, opt_fns, opt_this) {
  var result;
  var rightVal = this.right_.evaluate(opt_scope, opt_fns, opt_this);
  var leftVal = this.left_.evaluate(opt_scope, opt_fns, opt_this);
  /**
   * TODO: throw if rightVal, leftVal not numbers - this would require the use
   * of a concat function for strings but it would let us serialize these as
   * math functions where available elsewhere
   */

  var op = this.operator_;
  if (op === ol.expr.MathOp.ADD) {
    result = leftVal + rightVal;
  } else if (op === ol.expr.MathOp.SUBTRACT) {
    result = Number(leftVal) - Number(rightVal);
  } else if (op === ol.expr.MathOp.MULTIPLY) {
    result = Number(leftVal) * Number(rightVal);
  } else if (op === ol.expr.MathOp.DIVIDE) {
    result = Number(leftVal) / Number(rightVal);
  } else if (op === ol.expr.MathOp.MOD) {
    result = Number(leftVal) % Number(rightVal);
  } else {
    throw new Error('Unsupported math operator: ' + this.operator_);
  }
  return result;
};


/**
 * Get the math operator.
 * @return {string} The math operator.
 */
ol.expr.Math.prototype.getOperator = function() {
  return this.operator_;
};


/**
 * Get the left expression.
 * @return {ol.expr.Expression} The left expression.
 */
ol.expr.Math.prototype.getLeft = function() {
  return this.left_;
};


/**
 * Get the right expression.
 * @return {ol.expr.Expression} The right expression.
 */
ol.expr.Math.prototype.getRight = function() {
  return this.right_;
};



/**
 * A member expression (e.g. `foo.bar`).
 *
 * @constructor
 * @extends {ol.expr.Expression}
 * @param {ol.expr.Expression} object An expression that resolves to an
 *     object.
 * @param {ol.expr.Identifier} property Identifier with name of property.
 */
ol.expr.Member = function(object, property) {

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.object_ = object;

  /**
   * @type {ol.expr.Identifier}
   * @private
   */
  this.property_ = property;

};
goog.inherits(ol.expr.Member, ol.expr.Expression);


/**
 * @inheritDoc
 */
ol.expr.Member.prototype.evaluate = function(opt_scope, opt_fns,
    opt_this) {
  var obj = this.object_.evaluate(opt_scope, opt_fns, opt_this);
  if (!goog.isObject(obj)) {
    throw new Error('Expected member expression to evaluate to an object ' +
        'but got ' + obj);
  }
  return this.property_.evaluate(/** @type {Object} */ (obj));
};


/**
 * Get the object expression.
 * @return {ol.expr.Expression} The object.
 */
ol.expr.Member.prototype.getObject = function() {
  return this.object_;
};


/**
 * Get the property expression.
 * @return {ol.expr.Identifier} The property.
 */
ol.expr.Member.prototype.getProperty = function() {
  return this.property_;
};



/**
 * A logical not expression (e.g. `!foo`).
 *
 * @constructor
 * @extends {ol.expr.Expression}
 * @param {ol.expr.Expression} argument Expression to negate.
 */
ol.expr.Not = function(argument) {

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.argument_ = argument;

};
goog.inherits(ol.expr.Not, ol.expr.Expression);


/**
 * @inheritDoc
 */
ol.expr.Not.prototype.evaluate = function(opt_scope, opt_fns, opt_this) {
  return !this.argument_.evaluate(opt_scope, opt_fns, opt_this);
};


/**
 * Get the argument (the negated expression).
 * @return {ol.expr.Expression} The argument.
 */
ol.expr.Not.prototype.getArgument = function() {
  return this.argument_;
};
