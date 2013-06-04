/**
 * Support a very limited subset of ECMAScript 5.1
 * http://www.ecma-international.org/ecma-262/5.1/
 *
 * Inspired by Esprima (https://github.com/ariya/esprima)
 * BSD Licensed
 */


/**
 * @enum {string}
 */
ol.expression.Syntax = {
  BinaryExpression: 'BinaryExpression',
  CallExpression: 'CallExpression',
  Identifier: 'Identifier',
  Literal: 'Literal',
  LogicalExpression: 'LogicalExpression',
  MemberExpression: 'MemberExpression',
  Property: 'Property', // dot notation only
  UnaryExpression: 'UnaryExpression' // only with logical not
};


/**
 * @enum {string}
 */
ol.expression.Token = {
  BooleanLiteral: 'Boolean',
  EOF: '<end>',
  Identifier: 'Identifier',
  Keyword: 'Keyword',
  NullLiteral: 'Null',
  NumericLiteral: 'Numeric',
  Punctuator: 'Punctuator',
  StringLiteral: 'String'
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.2
 * @param {number} ch The unicode of a character.
 * @return {boolean} The character is whitespace.
 */
ol.expression.isWhitespace = function(ch) {
  return (ch === 32) || // <SP>
      (ch === 9) || // <TAB>
      (ch === 0xB) || // <VT>
      (ch === 0xC) || // <FF>
      (ch === 0xA0) || // <NBSP>
      (ch >= 0x1680 && '\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005' +
          '\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\uFEFF'
          .indexOf(String.fromCharCode(ch)) > 0);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.3
 * @param {number} ch The unicode of a character.
 * @return {boolean} The character is a line terminator.
 */
ol.expression.isLineTerminator = function(ch) {
  return (ch === 10) || // <LF>
      (ch === 13) || // <CR>
      (ch === 0x2028) || // <LS>
      (ch === 0x2029); // <PS>
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.6
 * Doesn't deal with non-ascii identifiers.
 * @param {number} ch The unicode of a character.
 * @return {boolean} The character is a valid identifier start.
 */
ol.expression.isIdentifierStart = function(ch) {
  return (ch === 36) || (ch === 95) || // $ (dollar) and _ (underscore)
      (ch >= 65 && ch <= 90) ||        // A..Z
      (ch >= 97 && ch <= 122);         // a..z
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.6
 * Doesn't deal with non-ascii identifiers.
 * @param {number} ch The unicode of a character.
 * @return {boolean} The character is a valid identifier part.
 */
ol.expression.isIdentifierPart = function(ch) {
  return ol.expression.isIdentifierStart(ch) ||
      (ch >= 48 && ch <= 57); // 0..9
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
