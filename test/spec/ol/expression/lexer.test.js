goog.provide('ol.test.expression.Lexer');

describe('ol.expression.Lexer', function() {

  describe('constructor', function() {
    it('creates a new lexer', function() {
      var lexer = new ol.expression.Lexer('foo');
      expect(lexer).to.be.a(ol.expression.Lexer);
    });
  });

  describe('#scanIdentifier_()', function() {

    function scan(source) {
      var lexer = new ol.expression.Lexer(source);
      return lexer.scanIdentifier_();
    }

    it('works for short identifiers', function() {
      var token = scan('a');
      expect(token.value).to.be('a');
      expect(token.type).to.be(ol.expression.TokenType.IDENTIFIER);
    });

    it('works for longer identifiers', function() {
      var token = scan('foo');
      expect(token.value).to.be('foo');
      expect(token.type).to.be(ol.expression.TokenType.IDENTIFIER);
    });

    it('works for $ anywhere', function() {
      var token = scan('$foo$bar$');
      expect(token.value).to.be('$foo$bar$');
      expect(token.type).to.be(ol.expression.TokenType.IDENTIFIER);
    });

    it('works for _ anywhere', function() {
      var token = scan('_foo_bar_');
      expect(token.value).to.be('_foo_bar_');
      expect(token.type).to.be(ol.expression.TokenType.IDENTIFIER);
    });

    it('works for keywords', function() {
      var token = scan('delete');
      expect(token.value).to.be('delete');
      expect(token.type).to.be(ol.expression.TokenType.KEYWORD);
    });

    it('works for null', function() {
      var token = scan('null');
      expect(token.value).to.be('null');
      expect(token.type).to.be(ol.expression.TokenType.NULL_LITERAL);
    });

    it('works for boolean true', function() {
      var token = scan('true');
      expect(token.value).to.be('true');
      expect(token.type).to.be(ol.expression.TokenType.BOOLEAN_LITERAL);
    });

    it('works for boolean false', function() {
      var token = scan('false');
      expect(token.value).to.be('false');
      expect(token.type).to.be(ol.expression.TokenType.BOOLEAN_LITERAL);
    });

    it('works with unicode escape sequences', function() {
      var token = scan('\u006f\u006c\u0033');
      expect(token.value).to.be('ol3');
      expect(token.type).to.be(ol.expression.TokenType.IDENTIFIER);
    });

    it('works with hex escape sequences', function() {
      var token = scan('\x6f\x6c\x33');
      expect(token.value).to.be('ol3');
      expect(token.type).to.be(ol.expression.TokenType.IDENTIFIER);
    });

    it('throws for identifiers starting with a number', function() {
      expect(function() {
        scan('4foo');
      }).throwException();
    });

    it('throws for identifiers starting with a punctuation char', function() {
      expect(function() {
        scan('!foo');
      }).throwException();
    });

    it('only scans valid identifier part', function() {
      var token = scan('foo>bar');
      expect(token.value).to.be('foo');
      expect(token.type).to.be(ol.expression.TokenType.IDENTIFIER);
    });

  });

  describe('#scanNumericLiteral_()', function() {

    function scan(source) {
      var lexer = new ol.expression.Lexer(source);
      return lexer.scanNumericLiteral_();
    }

    it('works for integers', function() {
      var token = scan('123');
      expect(token.value).to.be(123);
      expect(token.type).to.be(ol.expression.TokenType.NUMERIC_LITERAL);
    });

    it('works for float', function() {
      var token = scan('123.456');
      expect(token.value).to.be(123.456);
      expect(token.type).to.be(ol.expression.TokenType.NUMERIC_LITERAL);
    });

    it('works with exponent', function() {
      var token = scan('1.234e5');
      expect(token.value).to.be(1.234e5);
      expect(token.type).to.be(ol.expression.TokenType.NUMERIC_LITERAL);
    });

    it('works with explicit positive exponent', function() {
      var token = scan('1.234e+5');
      expect(token.value).to.be(1.234e5);
      expect(token.type).to.be(ol.expression.TokenType.NUMERIC_LITERAL);
    });

    it('works with negative exponent', function() {
      var token = scan('1.234e-5');
      expect(token.value).to.be(1.234e-5);
      expect(token.type).to.be(ol.expression.TokenType.NUMERIC_LITERAL);
    });

    it('works with octals', function() {
      var token = scan('02322');
      expect(token.value).to.be(1234);
      expect(token.type).to.be(ol.expression.TokenType.NUMERIC_LITERAL);
    });

    it('works with hex', function() {
      var token = scan('0x4d2');
      expect(token.value).to.be(1234);
      expect(token.type).to.be(ol.expression.TokenType.NUMERIC_LITERAL);
    });

  });

});

goog.require('ol.expression.Lexer');
goog.require('ol.expression.TokenType');
