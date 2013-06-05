goog.provide('ol.expression');


/**
 * Support an extremely limited subset of ECMAScript 5.1
 * http://www.ecma-international.org/ecma-262/5.1/
 *
 * Inspired by Esprima (https://github.com/ariya/esprima)
 * BSD Licensed
 */


/**
 * @enum {number}
 */
ol.expression.Char = {
  CARRIAGE_RETURN: 13,
  DIGIT_0: 48,
  DIGIT_7: 55,
  DIGIT_9: 57,
  DOLLAR: 36,
  FORM_FEED: 0xC,
  LINE_FEED: 10,
  LINE_SEPARATOR: 0x2028,
  LOWER_A: 97,
  LOWER_F: 102,
  LOWER_Z: 122,
  NONBREAKING_SPACE: 0xA0,
  PARAGRAPH_SEPARATOR: 0x2029,
  SPACE: 32,
  TAB: 9,
  UNDERSCORE: 95,
  UPPER_A: 65,
  UPPER_F: 70,
  UPPER_Z: 90,
  VERTICAL_TAB: 0xB
};


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


/**
 * @enum {string}
 */
ol.expression.TokenType = {
  BOOLEAN_LITERAL: 'Boolean',
  EOF: '<end>',
  IDENTIFIER: 'Identifier',
  KEYWORD: 'Keyword',
  NULL_LITERAL: 'Null',
  NUMERIC_LITERAL: 'Numeric',
  PUNCTUATOR: 'Punctuator',
  STRING_LITERAL: 'String'
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.3
 * @param {number} ch The unicode of a character.
 * @return {boolean} The character is a decimal digit.
 */
ol.expression.isDecimalDigit = function(ch) {
  return (ch >= ol.expression.Char.DIGIT_0 && ch <= ol.expression.Char.DIGIT_9);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.6.1.2
 * @param {string} id A string identifier.
 * @return {boolean} The identifier is a future reserved word.
 */
ol.expression.isFutureReservedWord = function(id) {
  switch (id) {
    case 'class':
    case 'enum':
    case 'export':
    case 'extends':
    case 'import':
    case 'super':
      return true;
    default:
      return false;
  }
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.3
 * @param {number} ch The unicode of a character.
 * @return {boolean} The character is a hex digit.
 */
ol.expression.isHexDigit = function(ch) {
  return ol.expression.isDecimalDigit(ch) ||
      (ch >= ol.expression.Char.LOWER_A && ch <= ol.expression.Char.LOWER_F) ||
      (ch >= ol.expression.Char.UPPER_A && ch <= ol.expression.Char.UPPER_F);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.6
 * Doesn't deal with non-ascii identifiers.
 * @param {number} ch The unicode of a character.
 * @return {boolean} The character is a valid identifier part.
 */
ol.expression.isIdentifierPart = function(ch) {
  return ol.expression.isIdentifierStart(ch) ||
      (ch >= ol.expression.Char.DIGIT_0 && ch <= ol.expression.Char.DIGIT_9);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.6
 * Doesn't yet deal with non-ascii identifiers.
 * @param {number} ch The unicode of a character.
 * @return {boolean} The character is a valid identifier start.
 */
ol.expression.isIdentifierStart = function(ch) {
  return (ch === ol.expression.Char.DOLLAR) ||
      (ch === ol.expression.Char.UNDERSCORE) ||
      (ch >= ol.expression.Char.UPPER_A && ch <= ol.expression.Char.UPPER_Z) ||
      (ch >= ol.expression.Char.LOWER_A && ch <= ol.expression.Char.LOWER_Z);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.3
 * @param {number} ch The unicode of a character.
 * @return {boolean} The character is a line terminator.
 */
ol.expression.isLineTerminator = function(ch) {
  return (ch === ol.expression.Char.LINE_FEED) ||
      (ch === ol.expression.Char.CARRIAGE_RETURN) ||
      (ch === ol.expression.Char.LINE_SEPARATOR) ||
      (ch === ol.expression.Char.PARAGRAPH_SEPARATOR);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.3
 * @param {number} ch The unicode of a character.
 * @return {boolean} The character is an octal digit.
 */
ol.expression.isOctalDigit = function(ch) {
  return (ch >= ol.expression.Char.DIGIT_0 && ch <= ol.expression.Char.DIGIT_7);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.2
 * @param {number} ch The unicode of a character.
 * @return {boolean} The character is whitespace.
 */
ol.expression.isWhitespace = function(ch) {
  return (ch === ol.expression.Char.SPACE) ||
      (ch === ol.expression.Char.TAB) ||
      (ch === ol.expression.Char.VERTICAL_TAB) ||
      (ch === ol.expression.Char.FORM_FEED) ||
      (ch === ol.expression.Char.NONBREAKING_SPACE) ||
      (ch >= 0x1680 && '\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005' +
          '\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\uFEFF'
          .indexOf(String.fromCharCode(ch)) > 0);
};
