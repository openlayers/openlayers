/**
 * The logic and naming of methods here are inspired by Esprima (BSD Licensed).
 * Esprima (http://esprima.org) includes the following copyright notices:
 *
 * Copyright (C) 2013 Ariya Hidayat <ariya.hidayat@gmail.com>
 * Copyright (C) 2013 Thaddee Tyl <thaddee.tyl@gmail.com>
 * Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
 * Copyright (C) 2012 Mathias Bynens <mathias@qiwi.be>
 * Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
 * Copyright (C) 2012 Kris Kowal <kris.kowal@cixar.com>
 * Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
 * Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
 * Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>
 */

goog.provide('ol.expr.Parser');

goog.require('goog.asserts');

goog.require('ol.expr.Call');
goog.require('ol.expr.Comparison');
goog.require('ol.expr.ComparisonOp');
goog.require('ol.expr.Expression');
goog.require('ol.expr.Identifier');
goog.require('ol.expr.Lexer');
goog.require('ol.expr.Literal');
goog.require('ol.expr.Logical');
goog.require('ol.expr.LogicalOp');
goog.require('ol.expr.Math');
goog.require('ol.expr.MathOp');
goog.require('ol.expr.Member');
goog.require('ol.expr.Not');
goog.require('ol.expr.Token');
goog.require('ol.expr.TokenType');
goog.require('ol.expr.UnexpectedToken');



/**
 * Instances of ol.expr.Parser parse a very limited set of ECMAScript
 * expressions (http://www.ecma-international.org/ecma-262/5.1/#sec-11).
 *
 * - Primary Expression (11.1):
 *   - Identifier (e.g. `foo`)
 *   - Literal (e.g. `"some string"` or `42`)
 *   - Grouped (e.g. `(foo)`)
 * - Left-Hand-Side Expression (11.2):
 *   - Property Accessors
 *     - Dot notation only
 *   - Function Calls
 *     - Identifier with arguments only (e.g. `foo(bar, 42)`)
 * - Unary Operators (11.4)
 *   - Logical Not (e.g. `!foo`)
 * - Multiplicitave Operators (11.5)
 * - Additive Operators (11.6)
 * - Relational Operators (11.8)
 *   - <, >, <=, and >= only
 * - Equality Operators (11.9)
 * - Binary Logical Operators (11.11)
 *
 * @constructor
 */
ol.expr.Parser = function() {
};


/**
 * Determine the precedence for the given token.
 *
 * @param {ol.expr.Token} token A token.
 * @return {number} The precedence for the given token.  Higher gets more
 *     precedence.
 * @private
 */
ol.expr.Parser.prototype.binaryPrecedence_ = function(token) {
  var precedence = 0;
  if (token.type !== ol.expr.TokenType.PUNCTUATOR) {
    return precedence;
  }

  switch (token.value) {
    case ol.expr.LogicalOp.OR:
      precedence = 1;
      break;
    case ol.expr.LogicalOp.AND:
      precedence = 2;
      break;
    case ol.expr.ComparisonOp.EQ:
    case ol.expr.ComparisonOp.NEQ:
    case ol.expr.ComparisonOp.STRICT_EQ:
    case ol.expr.ComparisonOp.STRICT_NEQ:
      precedence = 3;
      break;
    case ol.expr.ComparisonOp.GT:
    case ol.expr.ComparisonOp.LT:
    case ol.expr.ComparisonOp.GTE:
    case ol.expr.ComparisonOp.LTE:
      precedence = 4;
      break;
    case ol.expr.MathOp.ADD:
    case ol.expr.MathOp.SUBTRACT:
      precedence = 5;
      break;
    case ol.expr.MathOp.MULTIPLY:
    case ol.expr.MathOp.DIVIDE:
    case ol.expr.MathOp.MOD:
      precedence = 6;
      break;
    default:
      // punctuator is not a supported binary operator, that's fine
      break;
  }

  return precedence;
};


/**
 * Create a binary expression.
 *
 * @param {string} operator Operator.
 * @param {ol.expr.Expression} left Left expression.
 * @param {ol.expr.Expression} right Right expression.
 * @return {ol.expr.Expression} The expression.
 * @private
 */
ol.expr.Parser.prototype.createBinaryExpression_ = function(operator,
    left, right) {
  var expr;
  if (ol.expr.Comparison.isValidOp(operator)) {
    expr = new ol.expr.Comparison(
        /** @type {ol.expr.ComparisonOp.<string>} */ (operator),
        left, right);
  } else if (ol.expr.Logical.isValidOp(operator)) {
    expr = new ol.expr.Logical(
        /** @type {ol.expr.LogicalOp.<string>} */ (operator),
        left, right);
  } else if (ol.expr.Math.isValidOp(operator)) {
    expr = new ol.expr.Math(
        /** @type {ol.expr.MathOp.<string>} */ (operator),
        left, right);
  } else {
    throw new Error('Unsupported binary operator: ' + operator);
  }
  return expr;
};


/**
 * Create a call expression.
 *
 * @param {ol.expr.Expression} callee Expression for function.
 * @param {Array.<ol.expr.Expression>} args Arguments array.
 * @return {ol.expr.Call} Call expression.
 * @private
 */
ol.expr.Parser.prototype.createCallExpression_ = function(callee, args) {
  return new ol.expr.Call(callee, args);
};


/**
 * Create an identifier expression.
 *
 * @param {string} name Identifier name.
 * @return {ol.expr.Identifier} Identifier expression.
 * @private
 */
ol.expr.Parser.prototype.createIdentifier_ = function(name) {
  return new ol.expr.Identifier(name);
};


/**
 * Create a literal expression.
 *
 * @param {string|number|boolean|null} value Literal value.
 * @return {ol.expr.Literal} The literal expression.
 * @private
 */
ol.expr.Parser.prototype.createLiteral_ = function(value) {
  return new ol.expr.Literal(value);
};


/**
 * Create a member expression.
 *
 * // TODO: make exp {ol.expr.Member|ol.expr.Identifier}
 * @param {ol.expr.Expression} object Expression.
 * @param {ol.expr.Identifier} property Member name.
 * @return {ol.expr.Member} The member expression.
 * @private
 */
ol.expr.Parser.prototype.createMemberExpression_ = function(object,
    property) {
  return new ol.expr.Member(object, property);
};


/**
 * Create a unary expression.  The only true unary operator supported here is
 * "!".  For +/-, we apply the operator to literal expressions and return
 * another literal.
 *
 * @param {ol.expr.Token} op Operator.
 * @param {ol.expr.Expression} argument Expression.
 * @return {ol.expr.Expression} The unary expression.
 * @private
 */
ol.expr.Parser.prototype.createUnaryExpression_ = function(op, argument) {
  goog.asserts.assert(op.value === '!' || op.value === '+' || op.value === '-');
  var expr;
  if (op.value === '!') {
    expr = new ol.expr.Not(argument);
  } else if (!(argument instanceof ol.expr.Literal)) {
    throw new ol.expr.UnexpectedToken(op);
  } else {
    // we've got +/- literal
    if (op.value === '+') {
      expr = this.createLiteral_(
          + /** @type {number|string|boolean|null} */ (argument.evaluate()));
    } else {
      expr = this.createLiteral_(
          - /** @type {number|string|boolean|null} */ (argument.evaluate()));
    }
  }
  return expr;
};


/**
 * Parse an expression.
 *
 * @param {string} source Expression source.
 * @return {ol.expr.Expression} Expression.
 */
ol.expr.Parser.prototype.parse = function(source) {
  var lexer = new ol.expr.Lexer(source);
  var expr = this.parseExpression_(lexer);
  var token = lexer.peek();
  if (token.type !== ol.expr.TokenType.EOF) {
    throw new ol.expr.UnexpectedToken(token);
  }
  return expr;
};


/**
 * Parse call arguments
 * http://www.ecma-international.org/ecma-262/5.1/#sec-11.2.4
 *
 * @param {ol.expr.Lexer} lexer Lexer.
 * @return {Array.<ol.expr.Expression>} Arguments.
 * @private
 */
ol.expr.Parser.prototype.parseArguments_ = function(lexer) {
  var args = [];

  lexer.expect('(');

  if (!lexer.match(')')) {
    while (true) {
      args.push(this.parseBinaryExpression_(lexer));
      if (lexer.match(')')) {
        break;
      }
      lexer.expect(',');
    }
  }
  lexer.skip();

  return args;
};


/**
 * Parse a binary expression.  Supported binary expressions:
 *
 *  - Multiplicative Operators (`*`, `/`, `%`)
 *    http://www.ecma-international.org/ecma-262/5.1/#sec-11.5

 *  - Additive Operators (`+`, `-`)
 *    http://www.ecma-international.org/ecma-262/5.1/#sec-11.6
 *
 *  - Relational Operators (`<`, `>`, `<=`, `>=`)
 *    http://www.ecma-international.org/ecma-262/5.1/#sec-11.8
 *
 *  - Equality Operators (`==`, `!=`, `===`, `!==`)
 *    http://www.ecma-international.org/ecma-262/5.1/#sec-11.9
 *
 *  - Binary Logical Operators (`&&`, `||`)
 *    http://www.ecma-international.org/ecma-262/5.1/#sec-11.11
 *
 * @param {ol.expr.Lexer} lexer Lexer.
 * @return {ol.expr.Expression} Expression.
 * @private
 */
ol.expr.Parser.prototype.parseBinaryExpression_ = function(lexer) {
  var left = this.parseUnaryExpression_(lexer);

  var operator = lexer.peek();
  var precedence = this.binaryPrecedence_(operator);
  if (precedence === 0) {
    // not a supported binary operator
    return left;
  }
  lexer.skip();

  var right = this.parseUnaryExpression_(lexer);
  var stack = [left, operator, right];

  precedence = this.binaryPrecedence_(lexer.peek());
  while (precedence > 0) {
    // TODO: cache operator precedence in stack
    while (stack.length > 2 &&
        (precedence <= this.binaryPrecedence_(stack[stack.length - 2]))) {
      right = stack.pop();
      operator = stack.pop();
      left = stack.pop();
      stack.push(this.createBinaryExpression_(operator.value, left, right));
    }
    stack.push(lexer.next());
    stack.push(this.parseUnaryExpression_(lexer));
    precedence = this.binaryPrecedence_(lexer.peek());
  }

  var i = stack.length - 1;
  var expr = stack[i];
  while (i > 1) {
    expr = this.createBinaryExpression_(stack[i - 1].value, stack[i - 2], expr);
    i -= 2;
  }

  return expr;
};


/**
 * Parse a group expression.
 * http://www.ecma-international.org/ecma-262/5.1/#sec-11.1.6
 *
 * @param {ol.expr.Lexer} lexer Lexer.
 * @return {ol.expr.Expression} Expression.
 * @private
 */
ol.expr.Parser.prototype.parseGroupExpression_ = function(lexer) {
  lexer.expect('(');
  var expr = this.parseExpression_(lexer);
  lexer.expect(')');
  return expr;
};


/**
 * Parse left-hand-side expression.  Limited to Member Expressions
 * and Call Expressions.
 * http://www.ecma-international.org/ecma-262/5.1/#sec-11.2
 *
 * @param {ol.expr.Lexer} lexer Lexer.
 * @return {ol.expr.Expression} Expression.
 * @private
 */
ol.expr.Parser.prototype.parseLeftHandSideExpression_ = function(lexer) {
  var expr = this.parsePrimaryExpression_(lexer);
  var token = lexer.peek();
  if (token.value === '(') {
    // only allow calls on identifiers (e.g. `foo()` not `foo.bar()`)
    if (!(expr instanceof ol.expr.Identifier)) {
      // TODO: more helpful error messages for restricted syntax
      throw new ol.expr.UnexpectedToken(token);
    }
    var args = this.parseArguments_(lexer);
    expr = this.createCallExpression_(expr, args);
  } else {
    // TODO: throw if not Identifier
    while (token.value === '.') {
      var property = this.parseNonComputedMember_(lexer);
      expr = this.createMemberExpression_(expr, property);
      token = lexer.peek();
    }
  }
  return expr;
};


/**
 * Parse non-computed member.
 * http://www.ecma-international.org/ecma-262/5.1/#sec-11.2
 *
 * @param {ol.expr.Lexer} lexer Lexer.
 * @return {ol.expr.Identifier} Expression.
 * @private
 */
ol.expr.Parser.prototype.parseNonComputedMember_ = function(lexer) {
  lexer.expect('.');

  var token = lexer.next();
  if (token.type !== ol.expr.TokenType.IDENTIFIER &&
      token.type !== ol.expr.TokenType.KEYWORD &&
      token.type !== ol.expr.TokenType.BOOLEAN_LITERAL &&
      token.type !== ol.expr.TokenType.NULL_LITERAL) {
    throw new ol.expr.UnexpectedToken(token);
  }

  return this.createIdentifier_(String(token.value));
};


/**
 * Parse primary expression.
 * http://www.ecma-international.org/ecma-262/5.1/#sec-11.1
 *
 * @param {ol.expr.Lexer} lexer Lexer.
 * @return {ol.expr.Expression} Expression.
 * @private
 */
ol.expr.Parser.prototype.parsePrimaryExpression_ = function(lexer) {
  var token = lexer.peek();
  if (token.value === '(') {
    return this.parseGroupExpression_(lexer);
  }
  lexer.skip();
  var expr;
  var type = token.type;
  if (type === ol.expr.TokenType.IDENTIFIER) {
    expr = this.createIdentifier_(/** @type {string} */ (token.value));
  } else if (type === ol.expr.TokenType.STRING_LITERAL ||
      type === ol.expr.TokenType.NUMERIC_LITERAL) {
    // numeric and string literals are already the correct type
    expr = this.createLiteral_(token.value);
  } else if (type === ol.expr.TokenType.BOOLEAN_LITERAL) {
    // because booleans are valid member properties, tokens are still string
    expr = this.createLiteral_(token.value === 'true');
  } else if (type === ol.expr.TokenType.NULL_LITERAL) {
    expr = this.createLiteral_(null);
  } else {
    throw new ol.expr.UnexpectedToken(token);
  }
  return expr;
};


/**
 * Parse expression with a unary operator.  Limited to logical not operator.
 * http://www.ecma-international.org/ecma-262/5.1/#sec-11.4
 *
 * @param {ol.expr.Lexer} lexer Lexer.
 * @return {ol.expr.Expression} Expression.
 * @private
 */
ol.expr.Parser.prototype.parseUnaryExpression_ = function(lexer) {
  var expr;
  var operator = lexer.peek();
  if (operator.type !== ol.expr.TokenType.PUNCTUATOR) {
    expr = this.parseLeftHandSideExpression_(lexer);
  } else if (operator.value === '!' || operator.value === '-' ||
      operator.value === '+') {
    lexer.skip();
    expr = this.parseUnaryExpression_(lexer);
    expr = this.createUnaryExpression_(operator, expr);
  } else {
    expr = this.parseLeftHandSideExpression_(lexer);
  }
  return expr;
};


/**
 * Parse an expression.
 *
 * @param {ol.expr.Lexer} lexer Lexer.
 * @return {ol.expr.Expression} Expression.
 * @private
 */
ol.expr.Parser.prototype.parseExpression_ = function(lexer) {
  return this.parseBinaryExpression_(lexer);
};
