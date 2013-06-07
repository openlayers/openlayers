goog.provide('ol.expression.Lexer');
goog.provide('ol.expression.TokenType');

goog.require('goog.asserts');


/**
 * @enum {number}
 */
ol.expression.Char = {
  AMPERSAND: 38,
  BACKSLASH: 92,
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
  LOWER_E: 101,
  LOWER_F: 102,
  LOWER_U: 117,
  LOWER_X: 120,
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
  UPPER_E: 69,
  UPPER_F: 70,
  UPPER_X: 88,
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
 *
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
 *
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
  var code = this.getCurrentCharCode_();

  // check for common punctuation
  if (code === ol.expression.Char.LEFT_PAREN ||
      code === ol.expression.Char.RIGHT_PAREN) {
    return this.scanPunctuator_();
  }

  // check for string literal
  if (code === ol.expression.Char.SINGLE_QUOTE ||
      code === ol.expression.Char.DOUBLE_QUOTE) {
    return this.scanStringLiteral_();
  }

  // check for identifier
  if (this.isIdentifierStart_(code)) {
    this.scanIdentifier_();
  }

  // check dot punctuation or decimal
  if (code === ol.expression.Char.DOT) {
    if (this.isDecimalDigit_(this.getCharCode_(1))) {
      return this.scanNumericLiteral_();
    }
    return this.scanPunctuator_();
  }

  // check for numeric literal
  if (this.isDecimalDigit_(code)) {
    return this.scanNumericLiteral_();
  }

  // all the rest is punctuation
  return this.scanPunctuator_();
};


/**
 * Increment the current character index.
 *
 * @param {number} delta Delta by which the index is advanced.
 * @private
 */
ol.expression.Lexer.prototype.increment_ = function(delta) {
  this.index_ += delta;
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.3
 *
 * @param {number} code The unicode of a character.
 * @return {boolean} The character is a decimal digit.
 * @private
 */
ol.expression.Lexer.prototype.isDecimalDigit_ = function(code) {
  return (
      code >= ol.expression.Char.DIGIT_0 &&
      code <= ol.expression.Char.DIGIT_9);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.6.1.2
 *
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
 *
 * @param {number} code The unicode of a character.
 * @return {boolean} The character is a hex digit.
 * @private
 */
ol.expression.Lexer.prototype.isHexDigit_ = function(code) {
  return this.isDecimalDigit_(code) ||
      (code >= ol.expression.Char.LOWER_A &&
          code <= ol.expression.Char.LOWER_F) ||
      (code >= ol.expression.Char.UPPER_A &&
          code <= ol.expression.Char.UPPER_F);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.6
 * Doesn't deal with non-ascii identifiers.
 *
 * @param {number} code The unicode of a character.
 * @return {boolean} The character is a valid identifier part.
 * @private
 */
ol.expression.Lexer.prototype.isIdentifierPart_ = function(code) {
  return this.isIdentifierStart_(code) ||
      (code >= ol.expression.Char.DIGIT_0 &&
          code <= ol.expression.Char.DIGIT_9);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.6
 * Doesn't yet deal with non-ascii identifiers.
 *
 * @param {number} code The unicode of a character.
 * @return {boolean} The character is a valid identifier start.
 * @private
 */
ol.expression.Lexer.prototype.isIdentifierStart_ = function(code) {
  return (code === ol.expression.Char.DOLLAR) ||
      (code === ol.expression.Char.UNDERSCORE) ||
      (code >= ol.expression.Char.UPPER_A &&
          code <= ol.expression.Char.UPPER_Z) ||
      (code >= ol.expression.Char.LOWER_A &&
          code <= ol.expression.Char.LOWER_Z);
};


/**
 * Determine if the given identifier is an ECMAScript keyword.  These cannot
 * be used as identifiers in programs.  There is no real reason these could not
 * be used in ol expressions - so it might be worth allowing them.
 *
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.6.1.1
 * @param  {string} id Identifier.
 * @return {boolean} The identifier is a keyword.
 * @private
 */
ol.expression.Lexer.prototype.isKeyword_ = function(id) {
  return (
      id === 'break' ||
      id === 'case' ||
      id === 'catch' ||
      id === 'continue' ||
      id === 'debugger' ||
      id === 'default' ||
      id === 'delete' ||
      id === 'do' ||
      id === 'else' ||
      id === 'finally' ||
      id === 'for' ||
      id === 'function' ||
      id === 'if' ||
      id === 'in' ||
      id === 'instanceof' ||
      id === 'new' ||
      id === 'return' ||
      id === 'switch' ||
      id === 'this' ||
      id === 'throw' ||
      id === 'try' ||
      id === 'typeof' ||
      id === 'var' ||
      id === 'void' ||
      id === 'while' ||
      id === 'with');
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.3
 *
 * @param {number} code The unicode of a character.
 * @return {boolean} The character is a line terminator.
 * @private
 */
ol.expression.Lexer.prototype.isLineTerminator_ = function(code) {
  return (code === ol.expression.Char.LINE_FEED) ||
      (code === ol.expression.Char.CARRIAGE_RETURN) ||
      (code === ol.expression.Char.LINE_SEPARATOR) ||
      (code === ol.expression.Char.PARAGRAPH_SEPARATOR);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.3
 *
 * @param {number} code The unicode of a character.
 * @return {boolean} The character is an octal digit.
 * @private
 */
ol.expression.Lexer.prototype.isOctalDigit_ = function(code) {
  return (
      code >= ol.expression.Char.DIGIT_0 &&
      code <= ol.expression.Char.DIGIT_7);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.2
 *
 * @param {number} code The unicode of a character.
 * @return {boolean} The character is whitespace.
 * @private
 */
ol.expression.Lexer.prototype.isWhitespace_ = function(code) {
  return (code === ol.expression.Char.SPACE) ||
      (code === ol.expression.Char.TAB) ||
      (code === ol.expression.Char.VERTICAL_TAB) ||
      (code === ol.expression.Char.FORM_FEED) ||
      (code === ol.expression.Char.NONBREAKING_SPACE) ||
      (code >= 0x1680 && '\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005' +
          '\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\uFEFF'
          .indexOf(String.fromCharCode(code)) > 0);
};


/**
 * Get the unicode of the character at the given offset from the current index.
 *
 * @param {number} delta Offset from current index.
 * @return {number} The character code.
 * @private
 */
ol.expression.Lexer.prototype.getCharCode_ = function(delta) {
  return this.source_.charCodeAt(this.index_ + delta);
};


/**
 * Get the character at the current index.
 *
 * @return {string} The current character.
 * @private
 */
ol.expression.Lexer.prototype.getCurrentChar_ = function() {
  return this.source_[this.index_];
};


/**
 * Get the unicode of the character at the current index.
 *
 * @return {number} The current character code.
 * @private
 */
ol.expression.Lexer.prototype.getCurrentCharCode_ = function() {
  return this.getCharCode_(0);
};


/**
 * Get an identifier that includes escape sequences.
 *
 * @return {string} The identifier.
 * @private
 */
ol.expression.Lexer.prototype.getEscapedIdentifier_ = function() {
  var code = this.getCurrentCharCode_();
  var id = String.fromCharCode(code);

  this.increment_(1);

  // the \u sequence denotes an escaped character
  if (code === ol.expression.Char.BACKSLASH) {
    if (this.getCurrentCharCode_() !== ol.expression.Char.LOWER_U) {
      throw new Error('Unexpected token at index ' + this.index_ +
          ': ' + this.getCurrentChar_());
    }
    this.increment_(1);
    code = this.scanEscapeSequence_(ol.expression.Char.LOWER_U);

    if (!code || code === ol.expression.Char.BACKSLASH ||
        !this.isIdentifierStart_(code)) {
      throw new Error('Unexpected token at index ' + this.index_ +
          ': ' + this.getCurrentChar_());
    }
    id = String.fromCharCode(code);
  }

  while (this.index_ < this.length_) {
    code = this.getCurrentCharCode_();
    if (!this.isIdentifierPart_(code)) {
      break;
    }
    this.increment_(1);
    id += String.fromCharCode(code);

    // the \u sequence denotes an escaped character
    if (code === ol.expression.Char.BACKSLASH) {
      if (this.getCurrentCharCode_() !== ol.expression.Char.LOWER_U) {
        throw new Error('Unexpected token at index ' + this.index_ +
            ': ' + this.getCurrentChar_());
      }
      id = id.substr(0, id.length - 1);
      this.increment_(1);
      code = this.scanEscapeSequence_(ol.expression.Char.LOWER_U);

      if (!code || code === ol.expression.Char.BACKSLASH ||
          !this.isIdentifierStart_(code)) {
        throw new Error('Unexpected token at index ' + this.index_ +
            ': ' + this.getCurrentChar_());
      }
      id += String.fromCharCode(code);
    }
  }

  return id;
};


/**
 * Get an identifier.  This assumes we've encountered an identifier that doesn't
 * start with an escape sequence.  If an escape sequence is encountered during
 * the scan, we switch to the `getEscapedIdentifier_` method.
 *
 * @return {string} The identifier.
 * @private
 */
ol.expression.Lexer.prototype.getIdentifier_ = function() {
  goog.asserts.assert(
      this.getCurrentCharCode_() !== ol.expression.Char.BACKSLASH,
      'Must not be called with first char a backslash');

  var start = this.index_;
  this.increment_(1);

  var code;
  while (this.index_ < this.length_) {
    code = this.getCurrentCharCode_();
    if (code === ol.expression.Char.BACKSLASH) {
      // reset cursor and start over scanning escaped identifier
      this.index_ = start;
      return this.getEscapedIdentifier_();
    }
    if (this.isIdentifierPart_(code)) {
      this.increment_(1);
    } else {
      break;
    }
  }
  return this.source_.slice(start, this.index_);
};


/**
 * Scan an escape sequence of characters prefixed by the given character
 * code.  This works for both unicode escape sequences (e.g. \u0123) and
 * hex escape sequences (e.g. \x12).
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
 *
 * @param {number} prefix The character code of the escape prefix.
 * @return {number} The unicode of the string resulting from the escape
 *     sequence.  For invalid escape sequences, 0 is returned.
 * @private
 */
ol.expression.Lexer.prototype.scanEscapeSequence_ = function(prefix) {
  var code = 0;
  var len = (prefix === ol.expression.Char.LOWER_U) ? 4 : 2;
  var ch;
  for (var i = 0; i < len; ++i) {
    if (this.index_ < this.length_ &&
        this.isHexDigit_(this.getCurrentCharCode_())) {
      ch = this.getCurrentChar_();
      code = (code * 16) + parseInt(ch, 16);
      this.increment_(1);
    } else {
      return 0;
    }
  }
  return code;
};


/**
 * Scan hex literal as numeric token.
 *
 * @return {ol.expression.Token} Numeric literal token.
 * @private
 */
ol.expression.Lexer.prototype.scanHexLiteral_ = function() {
  var code = this.getCurrentCharCode_();
  var str = '';

  while (this.index_ < this.length_) {
    if (!this.isHexDigit_(code)) {
      break;
    }
    str += String.fromCharCode(code);
    this.increment_(1);
    code = this.getCurrentCharCode_();
  }

  if (str.length === 0) {
    throw new Error('Unexpected token at index ' + this.index_ +
        ': ' + String.fromCharCode(code));
  }

  if (this.isIdentifierStart_(code)) {
    throw new Error('Unexpected token at index ' + this.index_ +
        ': ' + String.fromCharCode(code));
  }

  goog.asserts.assert(!isNaN(parseInt('0x' + str, 16)), 'Valid hex: ' + str);

  return {
    type: ol.expression.TokenType.NUMERIC_LITERAL,
    value: parseInt('0x' + str, 16)
  };
};


/**
 * Scan identifier token.
 *
 * @return {ol.expression.Token} Identifier token.
 * @private
 */
ol.expression.Lexer.prototype.scanIdentifier_ = function() {
  var code = this.getCurrentCharCode_();
  goog.asserts.assert(this.isIdentifierStart_(code),
      'Must be called with a valid identifier');

  var id = (code === ol.expression.Char.BACKSLASH) ?
      this.getEscapedIdentifier_() : this.getIdentifier_();

  var type;
  if (id.length === 1) {
    type = ol.expression.TokenType.IDENTIFIER;
  } else if (this.isKeyword_(id)) {
    type = ol.expression.TokenType.KEYWORD;
  } else if (id === 'null') {
    type = ol.expression.TokenType.NULL_LITERAL;
  } else if (id === 'true' || id === 'false') {
    type = ol.expression.TokenType.BOOLEAN_LITERAL;
  } else {
    type = ol.expression.TokenType.IDENTIFIER;
  }

  return {
    type: type,
    value: id
  };
};


/**
 * Scan numeric literal token.
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.3
 *
 * @return {ol.expression.Token} Numeric literal token.
 * @private
 */
ol.expression.Lexer.prototype.scanNumericLiteral_ = function() {
  var code = this.getCurrentCharCode_();
  goog.asserts.assert(
      code === ol.expression.Char.DOT || this.isDecimalDigit_(code),
      'Valid start for numeric literal: ' + String.fromCharCode(code));

  // start assembling numeric string
  var str = '';

  if (code !== ol.expression.Char.DOT) {

    if (code === ol.expression.Char.DIGIT_0) {
      var nextCode = this.getCharCode_(1);

      // hex literals start with 0X or 0x
      if (nextCode === ol.expression.Char.UPPER_X ||
          nextCode === ol.expression.Char.LOWER_X) {
        this.increment_(2);
        return this.scanHexLiteral_();
      }

      // octals start with 0
      if (this.isOctalDigit_(nextCode)) {
        this.increment_(1);
        return this.scanOctalLiteral_();
      }

      // numbers like 09 not allowed
      if (this.isDecimalDigit_(nextCode)) {
        throw new Error('Unexpected token at index ' + this.index_ +
            ': ' + String.fromCharCode(nextCode));
      }
    }

    // scan all decimal chars
    while (this.isDecimalDigit_(code)) {
      str += String.fromCharCode(code);
      this.increment_(1);
      code = this.getCurrentCharCode_();
    }
  }

  // scan fractional part
  if (code === ol.expression.Char.DOT) {
    str += String.fromCharCode(code);
    this.increment_(1);
    code = this.getCurrentCharCode_();

    // scan all decimal chars
    while (this.isDecimalDigit_(code)) {
      str += String.fromCharCode(code);
      this.increment_(1);
      code = this.getCurrentCharCode_();
    }
  }

  // scan exponent
  if (code === ol.expression.Char.UPPER_E ||
      code === ol.expression.Char.LOWER_E) {
    str += 'E';
    this.increment_(1);

    code = this.getCurrentCharCode_();
    if (code === ol.expression.Char.PLUS ||
        code === ol.expression.Char.MINUS) {
      str += String.fromCharCode(code);
      this.increment_(1);
      code = this.getCurrentCharCode_();
    }

    if (!this.isDecimalDigit_(code)) {
      throw new Error('Unexpected token at index ' + this.index_ +
          ': ' + String.fromCharCode(code));
    }

    // scan all decimal chars (TODO: unduplicate this)
    while (this.isDecimalDigit_(code)) {
      str += String.fromCharCode(code);
      this.increment_(1);
      code = this.getCurrentCharCode_();
    }
  }

  if (this.isIdentifierStart_(code)) {
    throw new Error('Unexpected token at index ' + this.index_ +
        ': ' + String.fromCharCode(code));
  }

  goog.asserts.assert(!isNaN(parseFloat(str)), 'Valid number: ' + str);

  return {
    type: ol.expression.TokenType.NUMERIC_LITERAL,
    value: parseFloat(str)
  };

};


/**
 * Scan octal literal as numeric token.
 *
 * @return {ol.expression.Token} Numeric literal token.
 * @private
 */
ol.expression.Lexer.prototype.scanOctalLiteral_ = function() {
  var code = this.getCurrentCharCode_();
  goog.asserts.assert(this.isOctalDigit_(code));

  var str = '0' + String.fromCharCode(code);
  this.increment_(1);

  while (this.index_ < this.length_) {
    code = this.getCurrentCharCode_();
    if (!this.isOctalDigit_(code)) {
      break;
    }
    str += String.fromCharCode(code);
    this.increment_(1);
  }

  code = this.getCurrentCharCode_();
  if (this.isIdentifierStart_(code) ||
      this.isDecimalDigit_(code)) {
    throw new Error('Unexpected token at index ' + (this.index_ - 1) +
        ': ' + String.fromCharCode(code));
  }

  goog.asserts.assert(!isNaN(parseInt(str, 8)), 'Valid octal: ' + str);

  return {
    type: ol.expression.TokenType.NUMERIC_LITERAL,
    value: parseInt(str, 8)
  };
};


/**
 * Scan punctuator token (a subset of allowed tokens in 7.7).
 *
 * @return {ol.expression.Token} Punctuator token.
 * @private
 */
ol.expression.Lexer.prototype.scanPunctuator_ = function() {
  var code = this.getCurrentCharCode_();

  // single char punctuation
  if (code === ol.expression.Char.DOT ||
      code === ol.expression.Char.LEFT_PAREN ||
      code === ol.expression.Char.RIGHT_PAREN ||
      code === ol.expression.Char.COMMA ||
      code === ol.expression.Char.GREATER ||
      code === ol.expression.Char.LESS ||
      code === ol.expression.Char.PLUS ||
      code === ol.expression.Char.MINUS ||
      code === ol.expression.Char.STAR ||
      code === ol.expression.Char.PERCENT ||
      code === ol.expression.Char.PIPE ||
      code === ol.expression.Char.AMPERSAND ||
      code === ol.expression.Char.TILDE) {

    this.increment_(1);
    return {
      type: ol.expression.TokenType.PUNCTUATOR,
      value: String.fromCharCode(code)
    };
  }

  // check for 2-character punctuation
  var nextCode = this.getCharCode_(1);

  // assignment or comparison (and we don't allow assignment)
  if (nextCode === ol.expression.Char.EQUAL) {
    if (code === ol.expression.Char.BANG || code === ol.expression.Char.EQUAL) {
      // we're looking at !=, ==, !==, or ===
      this.increment_(2);

      // check for triple
      if (this.getCharCode_(1) === ol.expression.Char.EQUAL) {
        this.increment_(1);
        return {
          type: ol.expression.TokenType.PUNCTUATOR,
          value: String.fromCharCode(code) + '=='
        };
      } else {
        // != or ==
        return {
          type: ol.expression.TokenType.PUNCTUATOR,
          value: String.fromCharCode(code) + '='
        };
      }
    }

    if (code === ol.expression.Char.GREATER ||
        code === ol.expression.Char.LESS) {
      return {
        type: ol.expression.TokenType.PUNCTUATOR,
        value: String.fromCharCode(code) + '='
      };
    }
  }

  // remaining 2-charcter punctuators are || and &&
  if (code === nextCode &&
      (code === ol.expression.Char.PIPE ||
          code === ol.expression.Char.AMPERSAND)) {

    this.increment_(2);
    var str = String.fromCharCode(code);
    return {
      type: ol.expression.TokenType.PUNCTUATOR,
      value: str + str
    };
  }

  // we don't allow 4-character punctuator (>>>=)
  // and the allowed 3-character punctuators (!==, ===) are already consumed

  throw new Error('Unexpected token at index ' + (this.index_ - 1) +
      ': ' + String.fromCharCode(code));
};


/**
 * Scan string literal token.
 *
 * @return {ol.expression.Token} String literal token.
 * @private
 */
ol.expression.Lexer.prototype.scanStringLiteral_ = function() {
  throw new Error('Not yet implemented');
};


/**
 * Peek at the next token, but don't advance the index.
 *
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
 *
 * @return {Array.<ol.expression.Token>} Tokens.
 */
ol.expression.Lexer.prototype.tokenize = function() {
  return [];
};
