goog.provide('ol.expression.Lexer');


/**
 * @enum {number}
 */
ol.expression.Char = {
  AMPERSAND: 38,
  BANG: 33, // !
  CARRIAGE_RETURN: 13,
  COMMA: 44,
  DIGIT_0: 48,
  DIGIT_7: 55,
  DIGIT_9: 57,
  DOLLAR: 36,
  DOUBLE_QUOTE: 34,
  DOT: 46,
  EQUAL: 61,
  FORM_FEED: 0xC,
  GREATER: 62,
  LEFT_PAREN: 40,
  LESS: 60,
  LINE_FEED: 10,
  LINE_SEPARATOR: 0x2028,
  LOWER_A: 97,
  LOWER_F: 102,
  LOWER_Z: 122,
  MINUS: 45,
  NONBREAKING_SPACE: 0xA0,
  PARAGRAPH_SEPARATOR: 0x2029,
  PERCENT: 37,
  PIPE: 124,
  PLUS: 43,
  RIGHT_PAREN: 41,
  SINGLE_QUOTE: 39,
  SPACE: 32,
  STAR: 42,
  TAB: 9,
  TILDE: 126,
  UNDERSCORE: 95,
  UPPER_A: 65,
  UPPER_F: 70,
  UPPER_Z: 90,
  VERTICAL_TAB: 0xB
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
 * @typedef {{type: (ol.expression.TokenType),
 *            value: (string|number|boolean|null)}}
 */
ol.expression.Token;



/**
 * Lexer constructor.
 * @constructor
 * @param {string} source Source code.
 */
ol.expression.Lexer = function(source) {

  /**
   * Source code.
   * @type {string}
   * @private
   */
  this.source_ = source;

  /**
   * Source length.
   * @type {number}
   * @private
   */
  this.length_ = source.length;

  /**
   * Current character index.
   * @type {number}
   * @private
   */
  this.index_ = 0;

};


/**
 * Scan next token.
 * @return {ol.expression.Token} Next token.
 * @private
 */
ol.expression.Lexer.prototype.advance_ = function() {
  if (this.index_ >= this.length_) {
    return {
      type: ol.expression.TokenType.EOF,
      value: null
    };
  }
  var ch = this.getCurrentCharCode_();

  // check for common punctuation
  if (ch === ol.expression.Char.LEFT_PAREN ||
      ch === ol.expression.Char.RIGHT_PAREN) {
    return this.scanPunctuator_();
  }

  // check for string literal
  if (ch === ol.expression.Char.SINGLE_QUOTE ||
      ch === ol.expression.Char.DOUBLE_QUOTE) {
    return this.scanStringLiteral_();
  }

  // check for identifier
  if (this.isIdentifierStart_(ch)) {
    this.scanIdentifier_();
  }

  // check dot punctuation or decimal
  if (ch === ol.expression.Char.DOT) {
    if (this.isDecimalDigit_(this.getCharCode_(1))) {
      return this.scanNumericLiteral_();
    }
    return this.scanPunctuator_();
  }

  // check decimal number
  if (this.isDecimalDigit_(ch)) {
    return this.scanNumericLiteral_();
  }

  // all the rest is punctuation
  return this.scanPunctuator_();
};


/**
 * Increment the current character index.
 * @param {number} delta Delta by which the index is advanced.
 * @private
 */
ol.expression.Lexer.prototype.increment_ = function(delta) {
  this.index_ += delta;
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.3
 * @param {number} ch The unicode of a character.
 * @return {boolean} The character is a decimal digit.
 * @private
 */
ol.expression.Lexer.prototype.isDecimalDigit_ = function(ch) {
  return (ch >= ol.expression.Char.DIGIT_0 && ch <= ol.expression.Char.DIGIT_9);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.6.1.2
 * @param {string} id A string identifier.
 * @return {boolean} The identifier is a future reserved word.
 * @private
 */
ol.expression.Lexer.prototype.isFutureReservedWord_ = function(id) {
  return (
      id === 'class' ||
      id === 'enum' ||
      id === 'export' ||
      id === 'extends' ||
      id === 'import' ||
      id === 'super');
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.3
 * @param {number} ch The unicode of a character.
 * @return {boolean} The character is a hex digit.
 * @private
 */
ol.expression.Lexer.prototype.isHexDigit_ = function(ch) {
  return this.isDecimalDigit_(ch) ||
      (ch >= ol.expression.Char.LOWER_A && ch <= ol.expression.Char.LOWER_F) ||
      (ch >= ol.expression.Char.UPPER_A && ch <= ol.expression.Char.UPPER_F);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.6
 * Doesn't deal with non-ascii identifiers.
 * @param {number} ch The unicode of a character.
 * @return {boolean} The character is a valid identifier part.
 * @private
 */
ol.expression.Lexer.prototype.isIdentifierPart_ = function(ch) {
  return this.isIdentifierStart_(ch) ||
      (ch >= ol.expression.Char.DIGIT_0 && ch <= ol.expression.Char.DIGIT_9);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.6
 * Doesn't yet deal with non-ascii identifiers.
 * @param {number} ch The unicode of a character.
 * @return {boolean} The character is a valid identifier start.
 * @private
 */
ol.expression.Lexer.prototype.isIdentifierStart_ = function(ch) {
  return (ch === ol.expression.Char.DOLLAR) ||
      (ch === ol.expression.Char.UNDERSCORE) ||
      (ch >= ol.expression.Char.UPPER_A && ch <= ol.expression.Char.UPPER_Z) ||
      (ch >= ol.expression.Char.LOWER_A && ch <= ol.expression.Char.LOWER_Z);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.3
 * @param {number} ch The unicode of a character.
 * @return {boolean} The character is a line terminator.
 * @private
 */
ol.expression.Lexer.prototype.isLineTerminator_ = function(ch) {
  return (ch === ol.expression.Char.LINE_FEED) ||
      (ch === ol.expression.Char.CARRIAGE_RETURN) ||
      (ch === ol.expression.Char.LINE_SEPARATOR) ||
      (ch === ol.expression.Char.PARAGRAPH_SEPARATOR);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.3
 * @param {number} ch The unicode of a character.
 * @return {boolean} The character is an octal digit.
 * @private
 */
ol.expression.Lexer.prototype.isOctalDigit_ = function(ch) {
  return (ch >= ol.expression.Char.DIGIT_0 && ch <= ol.expression.Char.DIGIT_7);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.2
 * @param {number} ch The unicode of a character.
 * @return {boolean} The character is whitespace.
 * @private
 */
ol.expression.Lexer.prototype.isWhitespace_ = function(ch) {
  return (ch === ol.expression.Char.SPACE) ||
      (ch === ol.expression.Char.TAB) ||
      (ch === ol.expression.Char.VERTICAL_TAB) ||
      (ch === ol.expression.Char.FORM_FEED) ||
      (ch === ol.expression.Char.NONBREAKING_SPACE) ||
      (ch >= 0x1680 && '\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005' +
          '\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\uFEFF'
          .indexOf(String.fromCharCode(ch)) > 0);
};


/**
 * Get the unicode of the character at the given offset from the current index.
 * @param {number} delta Offset from current index.
 * @return {number} The character code.
 * @private
 */
ol.expression.Lexer.prototype.getCharCode_ = function(delta) {
  return this.source_.charCodeAt(this.index_ + delta);
};


/**
 * Get the unicode of the character at the current index.
 * @return {number} The current character code.
 * @private
 */
ol.expression.Lexer.prototype.getCurrentCharCode_ = function() {
  return this.getCharCode_(0);
};


/**
 * Scan punctuator token (a subset of allowed tokens in 7.7).
 * @return {ol.expression.Token} Punctuator token.
 * @private
 */
ol.expression.Lexer.prototype.scanPunctuator_ = function() {
  var ch = this.getCurrentCharCode_();

  // single char punctuation
  if (ch === ol.expression.Char.DOT ||
      ch === ol.expression.Char.LEFT_PAREN ||
      ch === ol.expression.Char.RIGHT_PAREN ||
      ch === ol.expression.Char.COMMA ||
      ch === ol.expression.Char.GREATER ||
      ch === ol.expression.Char.LESS ||
      ch === ol.expression.Char.PLUS ||
      ch === ol.expression.Char.MINUS ||
      ch === ol.expression.Char.STAR ||
      ch === ol.expression.Char.PERCENT ||
      ch === ol.expression.Char.PIPE ||
      ch === ol.expression.Char.AMPERSAND ||
      ch === ol.expression.Char.TILDE) {

    this.increment_(1);
    return {
      type: ol.expression.TokenType.PUNCTUATOR,
      value: String.fromCharCode(ch)
    };
  }

  // check for 2-character punctuation
  var ch1 = this.getCharCode_(1);

  // assignment or comparison (and we don't allow assignment)
  if (ch1 === ol.expression.Char.EQUAL) {
    if (ch === ol.expression.Char.BANG || ch === ol.expression.Char.EQUAL) {
      // we're looking at !=, ==, !==, or ===
      this.increment_(2);

      // check for triple
      if (this.getCharCode_(1) === ol.expression.Char.EQUAL) {
        this.increment_(1);
        return {
          type: ol.expression.TokenType.PUNCTUATOR,
          value: String.fromCharCode(ch) + '=='
        };
      } else {
        // != or ==
        return {
          type: ol.expression.TokenType.PUNCTUATOR,
          value: String.fromCharCode(ch) + '='
        };
      }
    }

    if (ch === ol.expression.Char.GREATER || ch === ol.expression.Char.LESS) {
      return {
        type: ol.expression.TokenType.PUNCTUATOR,
        value: String.fromCharCode(ch) + '='
      };
    }
  }

  // remaining 2-charcter punctuators are || and &&
  if (ch === ch1 &&
      (ch === ol.expression.Char.PIPE || ch === ol.expression.Char.AMPERSAND)) {

    this.increment_(2);
    var str = String.fromCharCode(ch);
    return {
      type: ol.expression.TokenType.PUNCTUATOR,
      value: str + str
    };
  }

  // we don't allow 4-character punctuator (>>>=)
  // and the allowed 3-character punctuators (!==, ===) are already consumed

  throw new Error('Unexpected token at index ' + this.index_ +
      ': ' + String.fromCharCode(ch));
};


/**
 * Scan identifier token.
 * @return {ol.expression.Token} Identifier token.
 * @private
 */
ol.expression.Lexer.prototype.scanIdentifier_ = function() {
  throw new Error('Not yet implemented');
};


/**
 * Scan numeric literal token.
 * @return {ol.expression.Token} Numeric literal token.
 * @private
 */
ol.expression.Lexer.prototype.scanNumericLiteral_ = function() {
  throw new Error('Not yet implemented');
};


/**
 * Scan string literal token.
 * @return {ol.expression.Token} String literal token.
 * @private
 */
ol.expression.Lexer.prototype.scanStringLiteral_ = function() {
  throw new Error('Not yet implemented');
};


/**
 * Peek at the next token, but don't advance the index.
 * @return {ol.expression.Token} The upcoming token.
 * @private
 */
ol.expression.Lexer.prototype.peek_ = function() {
  var currentIndex = this.index_;
  var token = this.advance_();
  this.index_ = currentIndex;
  return token;
};


/**
 * Tokenize the provided code.
 * @return {Array.<ol.expression.Token>} Tokens.
 */
ol.expression.Lexer.prototype.tokenize = function() {
  return [];
};
