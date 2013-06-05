goog.provide('ol.expression');


/**
 * Support an extremely limited subset of ECMAScript 5.1
 * http://www.ecma-international.org/ecma-262/5.1/
 *
 * Inspired by Esprima (https://github.com/ariya/esprima)
 * BSD Licensed
 */


/**
 * @enum {string}
 */
ol.expression.Syntax = {
  BINARY_EXPRESSION: 'BinaryExpression',
  CALL_EXPRESSION: 'CallExpression',
  IDENTIFIER: 'Identifier',
  LITERAL: 'Literal',
  LOGICAL_EXPRESSION: 'LogicalExpression',
  MEMBER_EXPRESSION: 'MemberExpression',
  PROPERTY: 'Property', // dot notation only
  UNARY_EXPRESSION: 'UnaryExpression' // only with logical not
};
