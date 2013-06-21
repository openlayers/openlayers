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

goog.provide('ol.expr.Char'); // TODO: remove this - see #785
goog.provide('ol.expr.Lexer');
goog.provide('ol.expr.Token');
goog.provide('ol.expr.TokenType');
goog.provide('ol.expr.UnexpectedToken');

goog.require('goog.asserts');
goog.require('goog.debug.Error');


/**
 * @enum {number}
 */
ol.expr.Char = {
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
  SLASH: 47,
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
ol.expr.TokenType = {
  BOOLEAN_LITERAL: 'Boolean',
  EOF: '<end>',
  IDENTIFIER: 'Identifier',
  KEYWORD: 'Keyword',
  NULL_LITERAL: 'Null',
  NUMERIC_LITERAL: 'Numeric',
  PUNCTUATOR: 'Punctuator',
  STRING_LITERAL: 'String',
  UNKNOWN: 'Unknown'
};


/**
 * @typedef {{type: (ol.expr.TokenType),
 *            value: (string|number|boolean|null),
 *            index: (number)}}
 */
ol.expr.Token;



/**
 * Lexer constructor.  Provides a tokenizer for a limited subset of ECMAScript
 * 5.1 expressions (http://www.ecma-international.org/ecma-262/5.1/#sec-11).
 *
 * @constructor
 * @param {string} source Source code.
 */
ol.expr.Lexer = function(source) {

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

  /**
   * Next character index (only set after `peek`ing).
   * @type {number}
   * @private
   */
  this.nextIndex_ = 0;

};


/**
 * Scan the next token and throw if it isn't a punctuator that matches input.
 * @param {string} value Token value.
 */
ol.expr.Lexer.prototype.expect = function(value) {
  var match = this.match(value);
  if (!match) {
    throw new ol.expr.UnexpectedToken({
      type: ol.expr.TokenType.UNKNOWN,
      value: this.getCurrentChar_(),
      index: this.index_
    });
  }
  this.skip();
};


/**
 * Increment the current character index.
 *
 * @param {number} delta Delta by which the index is advanced.
 * @private
 */
ol.expr.Lexer.prototype.increment_ = function(delta) {
  this.index_ += delta;
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.3
 *
 * @param {number} code The unicode of a character.
 * @return {boolean} The character is a decimal digit.
 * @private
 */
ol.expr.Lexer.prototype.isDecimalDigit_ = function(code) {
  return (
      code >= ol.expr.Char.DIGIT_0 &&
      code <= ol.expr.Char.DIGIT_9);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.6.1.2
 *
 * @param {string} id A string identifier.
 * @return {boolean} The identifier is a future reserved word.
 * @private
 */
ol.expr.Lexer.prototype.isFutureReservedWord_ = function(id) {
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
ol.expr.Lexer.prototype.isHexDigit_ = function(code) {
  return this.isDecimalDigit_(code) ||
      (code >= ol.expr.Char.LOWER_A &&
          code <= ol.expr.Char.LOWER_F) ||
      (code >= ol.expr.Char.UPPER_A &&
          code <= ol.expr.Char.UPPER_F);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.6
 * Doesn't deal with non-ascii identifiers.
 *
 * @param {number} code The unicode of a character.
 * @return {boolean} The character is a valid identifier part.
 * @private
 */
ol.expr.Lexer.prototype.isIdentifierPart_ = function(code) {
  return this.isIdentifierStart_(code) ||
      (code >= ol.expr.Char.DIGIT_0 &&
          code <= ol.expr.Char.DIGIT_9);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.6
 * Doesn't yet deal with non-ascii identifiers.
 *
 * @param {number} code The unicode of a character.
 * @return {boolean} The character is a valid identifier start.
 * @private
 */
ol.expr.Lexer.prototype.isIdentifierStart_ = function(code) {
  return (code === ol.expr.Char.DOLLAR) ||
      (code === ol.expr.Char.UNDERSCORE) ||
      (code >= ol.expr.Char.UPPER_A &&
          code <= ol.expr.Char.UPPER_Z) ||
      (code >= ol.expr.Char.LOWER_A &&
          code <= ol.expr.Char.LOWER_Z);
};


/**
 * Determine if the given identifier is an ECMAScript keyword.  These cannot
 * be used as identifiers in programs.  There is no real reason these could not
 * be used in ol.exprs - but they are reserved for future use.
 *
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.6.1.1
 *
 * @param  {string} id Identifier.
 * @return {boolean} The identifier is a keyword.
 * @private
 */
ol.expr.Lexer.prototype.isKeyword_ = function(id) {
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
ol.expr.Lexer.prototype.isLineTerminator_ = function(code) {
  return (code === ol.expr.Char.LINE_FEED) ||
      (code === ol.expr.Char.CARRIAGE_RETURN) ||
      (code === ol.expr.Char.LINE_SEPARATOR) ||
      (code === ol.expr.Char.PARAGRAPH_SEPARATOR);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.3
 *
 * @param {number} code The unicode of a character.
 * @return {boolean} The character is an octal digit.
 * @private
 */
ol.expr.Lexer.prototype.isOctalDigit_ = function(code) {
  return (
      code >= ol.expr.Char.DIGIT_0 &&
      code <= ol.expr.Char.DIGIT_7);
};


/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.2
 *
 * @param {number} code The unicode of a character.
 * @return {boolean} The character is whitespace.
 * @private
 */
ol.expr.Lexer.prototype.isWhitespace_ = function(code) {
  return (code === ol.expr.Char.SPACE) ||
      (code === ol.expr.Char.TAB) ||
      (code === ol.expr.Char.VERTICAL_TAB) ||
      (code === ol.expr.Char.FORM_FEED) ||
      (code === ol.expr.Char.NONBREAKING_SPACE) ||
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
ol.expr.Lexer.prototype.getCharCode_ = function(delta) {
  return this.source_.charCodeAt(this.index_ + delta);
};


/**
 * Get the character at the current index.
 *
 * @return {string} The current character.
 * @private
 */
ol.expr.Lexer.prototype.getCurrentChar_ = function() {
  return this.source_[this.index_];
};


/**
 * Get the unicode of the character at the current index.
 *
 * @return {number} The current character code.
 * @private
 */
ol.expr.Lexer.prototype.getCurrentCharCode_ = function() {
  return this.getCharCode_(0);
};


/**
 * Determine whether the upcoming token matches the given punctuator.
 * @param {string} value Punctuator value.
 * @return {boolean} The token matches.
 */
ol.expr.Lexer.prototype.match = function(value) {
  var token = this.peek();
  return (
      token.type === ol.expr.TokenType.PUNCTUATOR &&
      token.value === value);
};


/**
 * Scan the next token.
 *
 * @return {ol.expr.Token} Next token.
 */
ol.expr.Lexer.prototype.next = function() {
  var code = this.skipWhitespace_();

  if (this.index_ >= this.length_) {
    return {
      type: ol.expr.TokenType.EOF,
      value: null,
      index: this.index_
    };
  }

  // check for common punctuation
  if (code === ol.expr.Char.LEFT_PAREN ||
      code === ol.expr.Char.RIGHT_PAREN) {
    return this.scanPunctuator_(code);
  }

  // check for string literal
  if (code === ol.expr.Char.SINGLE_QUOTE ||
      code === ol.expr.Char.DOUBLE_QUOTE) {
    return this.scanStringLiteral_(code);
  }

  // check for identifier
  if (this.isIdentifierStart_(code)) {
    return this.scanIdentifier_(code);
  }

  // check dot punctuation or decimal
  if (code === ol.expr.Char.DOT) {
    if (this.isDecimalDigit_(this.getCharCode_(1))) {
      return this.scanNumericLiteral_(code);
    }
    return this.scanPunctuator_(code);
  }

  // check for numeric literal
  if (this.isDecimalDigit_(code)) {
    return this.scanNumericLiteral_(code);
  }

  // all the rest is punctuation
  return this.scanPunctuator_(code);
};


/**
 * Peek at the next token, but don't advance the index.
 *
 * @return {ol.expr.Token} The upcoming token.
 */
ol.expr.Lexer.prototype.peek = function() {
  var currentIndex = this.index_;
  var token = this.next();
  this.nextIndex_ = this.index_;
  this.index_ = currentIndex;
  return token;
};


/**
 * Scan hex literal as numeric token.
 *
 * @param {number} code The current character code.
 * @return {ol.expr.Token} Numeric literal token.
 * @private
 */
ol.expr.Lexer.prototype.scanHexLiteral_ = function(code) {
  var str = '';
  var start = this.index_ - 2;

  while (this.index_ < this.length_) {
    if (!this.isHexDigit_(code)) {
      break;
    }
    str += String.fromCharCode(code);
    this.increment_(1);
    code = this.getCurrentCharCode_();
  }

  if (str.length === 0 || this.isIdentifierStart_(code)) {
    throw new ol.expr.UnexpectedToken({
      type: ol.expr.TokenType.UNKNOWN,
      value: String.fromCharCode(code),
      index: this.index_
    });
  }

  goog.asserts.assert(!isNaN(parseInt('0x' + str, 16)), 'Valid hex: ' + str);

  return {
    type: ol.expr.TokenType.NUMERIC_LITERAL,
    value: parseInt('0x' + str, 16),
    index: start
  };
};


/**
 * Scan identifier token.
 *
 * @param {number} code The current character code.
 * @return {ol.expr.Token} Identifier token.
 * @private
 */
ol.expr.Lexer.prototype.scanIdentifier_ = function(code) {
  goog.asserts.assert(this.isIdentifierStart_(code),
      'Must be called with a valid identifier');

  var start = this.index_;
  this.increment_(1);

  while (this.index_ < this.length_) {
    code = this.getCurrentCharCode_();
    if (this.isIdentifierPart_(code)) {
      this.increment_(1);
    } else {
      break;
    }
  }
  var id = this.source_.slice(start, this.index_);

  var type;
  if (id.length === 1) {
    type = ol.expr.TokenType.IDENTIFIER;
  } else if (this.isKeyword_(id)) {
    type = ol.expr.TokenType.KEYWORD;
  } else if (id === 'null') {
    type = ol.expr.TokenType.NULL_LITERAL;
  } else if (id === 'true' || id === 'false') {
    type = ol.expr.TokenType.BOOLEAN_LITERAL;
  } else {
    type = ol.expr.TokenType.IDENTIFIER;
  }

  return {
    type: type,
    value: id,
    index: start
  };
};


/**
 * Scan numeric literal token.
 * http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.3
 *
 * @param {number} code The current character code.
 * @return {ol.expr.Token} Numeric literal token.
 * @private
 */
ol.expr.Lexer.prototype.scanNumericLiteral_ = function(code) {
  goog.asserts.assert(
      code === ol.expr.Char.DOT || this.isDecimalDigit_(code),
      'Valid start for numeric literal: ' + String.fromCharCode(code));

  // start assembling numeric string
  var str = '';
  var start = this.index_;

  if (code !== ol.expr.Char.DOT) {

    if (code === ol.expr.Char.DIGIT_0) {
      var nextCode = this.getCharCode_(1);

      // hex literals start with 0X or 0x
      if (nextCode === ol.expr.Char.UPPER_X ||
          nextCode === ol.expr.Char.LOWER_X) {
        this.increment_(2);
        return this.scanHexLiteral_(this.getCurrentCharCode_());
      }

      // octals start with 0
      if (this.isOctalDigit_(nextCode)) {
        this.increment_(1);
        return this.scanOctalLiteral_(nextCode);
      }

      // numbers like 09 not allowed
      if (this.isDecimalDigit_(nextCode)) {
        throw new ol.expr.UnexpectedToken({
          type: ol.expr.TokenType.UNKNOWN,
          value: String.fromCharCode(nextCode),
          index: this.index_
        });
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
  if (code === ol.expr.Char.DOT) {
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
  if (code === ol.expr.Char.UPPER_E ||
      code === ol.expr.Char.LOWER_E) {
    str += 'E';
    this.increment_(1);

    code = this.getCurrentCharCode_();
    if (code === ol.expr.Char.PLUS ||
        code === ol.expr.Char.MINUS) {
      str += String.fromCharCode(code);
      this.increment_(1);
      code = this.getCurrentCharCode_();
    }

    if (!this.isDecimalDigit_(code)) {
      throw new ol.expr.UnexpectedToken({
        type: ol.expr.TokenType.UNKNOWN,
        value: String.fromCharCode(code),
        index: this.index_
      });
    }

    // scan all decimal chars (TODO: unduplicate this)
    while (this.isDecimalDigit_(code)) {
      str += String.fromCharCode(code);
      this.increment_(1);
      code = this.getCurrentCharCode_();
    }
  }

  if (this.isIdentifierStart_(code)) {
    throw new ol.expr.UnexpectedToken({
      type: ol.expr.TokenType.UNKNOWN,
      value: String.fromCharCode(code),
      index: this.index_
    });
  }

  goog.asserts.assert(!isNaN(parseFloat(str)), 'Valid number: ' + str);

  return {
    type: ol.expr.TokenType.NUMERIC_LITERAL,
    value: parseFloat(str),
    index: start
  };

};


/**
 * Scan octal literal as numeric token.
 *
 * @param {number} code The current character code.
 * @return {ol.expr.Token} Numeric literal token.
 * @private
 */
ol.expr.Lexer.prototype.scanOctalLiteral_ = function(code) {
  goog.asserts.assert(this.isOctalDigit_(code));

  var str = '0' + String.fromCharCode(code);
  var start = this.index_ - 1;
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
    throw new ol.expr.UnexpectedToken({
      type: ol.expr.TokenType.UNKNOWN,
      value: String.fromCharCode(code),
      index: this.index_
    });
  }

  goog.asserts.assert(!isNaN(parseInt(str, 8)), 'Valid octal: ' + str);

  return {
    type: ol.expr.TokenType.NUMERIC_LITERAL,
    value: parseInt(str, 8),
    index: start
  };
};


/**
 * Scan punctuator token (a subset of allowed tokens in 7.7).
 *
 * @param {number} code The current character code.
 * @return {ol.expr.Token} Punctuator token.
 * @private
 */
ol.expr.Lexer.prototype.scanPunctuator_ = function(code) {
  var start = this.index_;

  // single char punctuation that also doesn't start longer punctuation
  // (we disallow assignment, so no += etc.)
  if (code === ol.expr.Char.DOT ||
      code === ol.expr.Char.LEFT_PAREN ||
      code === ol.expr.Char.RIGHT_PAREN ||
      code === ol.expr.Char.COMMA ||
      code === ol.expr.Char.PLUS ||
      code === ol.expr.Char.MINUS ||
      code === ol.expr.Char.STAR ||
      code === ol.expr.Char.SLASH ||
      code === ol.expr.Char.PERCENT ||
      code === ol.expr.Char.TILDE) {

    this.increment_(1);
    return {
      type: ol.expr.TokenType.PUNCTUATOR,
      value: String.fromCharCode(code),
      index: start
    };
  }

  // check for 2-character punctuation
  var nextCode = this.getCharCode_(1);

  // assignment or comparison (and we don't allow assignment)
  if (nextCode === ol.expr.Char.EQUAL) {
    if (code === ol.expr.Char.BANG || code === ol.expr.Char.EQUAL) {
      // we're looking at !=, ==, !==, or ===
      this.increment_(2);

      // check for triple
      if (this.getCurrentCharCode_() === ol.expr.Char.EQUAL) {
        this.increment_(1);
        return {
          type: ol.expr.TokenType.PUNCTUATOR,
          value: String.fromCharCode(code) + '==',
          index: start
        };
      } else {
        // != or ==
        return {
          type: ol.expr.TokenType.PUNCTUATOR,
          value: String.fromCharCode(code) + '=',
          index: start
        };
      }
    }

    if (code === ol.expr.Char.GREATER ||
        code === ol.expr.Char.LESS) {
      this.increment_(2);
      return {
        type: ol.expr.TokenType.PUNCTUATOR,
        value: String.fromCharCode(code) + '=',
        index: start
      };
    }
  }

  // remaining 2-charcter punctuators are || and &&
  if (code === nextCode &&
      (code === ol.expr.Char.PIPE ||
          code === ol.expr.Char.AMPERSAND)) {

    this.increment_(2);
    var str = String.fromCharCode(code);
    return {
      type: ol.expr.TokenType.PUNCTUATOR,
      value: str + str,
      index: start
    };
  }

  // we don't allow 4-character punctuator (>>>=)
  // and the allowed 3-character punctuators (!==, ===) are already consumed

  // other single character punctuators
  if (code === ol.expr.Char.GREATER ||
      code === ol.expr.Char.LESS ||
      code === ol.expr.Char.BANG ||
      code === ol.expr.Char.AMPERSAND ||
      code === ol.expr.Char.PIPE) {

    this.increment_(1);
    return {
      type: ol.expr.TokenType.PUNCTUATOR,
      value: String.fromCharCode(code),
      index: start
    };
  }

  throw new ol.expr.UnexpectedToken({
    type: ol.expr.TokenType.UNKNOWN,
    value: String.fromCharCode(code),
    index: this.index_
  });
};


/**
 * Scan string literal token.
 *
 * @param {number} quote The current character code.
 * @return {ol.expr.Token} String literal token.
 * @private
 */
ol.expr.Lexer.prototype.scanStringLiteral_ = function(quote) {
  goog.asserts.assert(quote === ol.expr.Char.SINGLE_QUOTE ||
      quote === ol.expr.Char.DOUBLE_QUOTE,
      'Strings must start with a quote: ' + String.fromCharCode(quote));

  var start = this.index_;
  this.increment_(1);

  var str = '';
  var code;
  while (this.index_ < this.length_) {
    code = this.getCurrentCharCode_();
    this.increment_(1);
    if (code === quote) {
      quote = 0;
      break;
    }
    // look for escaped quote or backslash
    if (code === ol.expr.Char.BACKSLASH) {
      str += this.getCurrentChar_();
      this.increment_(1);
    } else {
      str += String.fromCharCode(code);
    }
  }

  if (quote !== 0) {
    // unterminated string literal
    throw new ol.expr.UnexpectedToken(this.peek());
  }

  return {
    type: ol.expr.TokenType.STRING_LITERAL,
    value: str,
    index: start
  };
};


/**
 * After peeking, skip may be called to advance the cursor without re-scanning.
 */
ol.expr.Lexer.prototype.skip = function() {
  this.index_ = this.nextIndex_;
};


/**
 * Skip all whitespace.
 * @return {number} The character code of the first non-whitespace character.
 * @private
 */
ol.expr.Lexer.prototype.skipWhitespace_ = function() {
  var code = NaN;
  while (this.index_ < this.length_) {
    code = this.getCurrentCharCode_();
    if (this.isWhitespace_(code)) {
      this.increment_(1);
    } else {
      break;
    }
  }
  return code;
};



/**
 * Error object for unexpected tokens.
 * @param {ol.expr.Token} token The unexpected token.
 * @param {string=} opt_message Custom error message.
 * @constructor
 * @extends {goog.debug.Error}
 */
ol.expr.UnexpectedToken = function(token, opt_message) {
  var message = goog.isDef(opt_message) ? opt_message :
      'Unexpected token ' + token.value + ' at index ' + token.index;

  goog.debug.Error.call(this, message);

  /**
   * @type {ol.expr.Token}
   */
  this.token = token;

};
goog.inherits(ol.expr.UnexpectedToken, goog.debug.Error);


/** @override */
ol.expr.UnexpectedToken.prototype.name = 'UnexpectedToken';
