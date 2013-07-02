goog.provide('ol.test.expression.Lexer');

describe('ol.expr.Lexer', function() {

  describe('constructor', function() {
    it('creates a new lexer', function() {
      var lexer = new ol.expr.Lexer('foo');
      expect(lexer).to.be.a(ol.expr.Lexer);
    });
  });

  describe('#next()', function() {

    it('returns one token at a time', function() {
      var source = 'foo === "bar"';
      var lexer = new ol.expr.Lexer(source);

      // scan first token
      var token = lexer.next();
      expect(token.type).to.be(ol.expr.TokenType.IDENTIFIER);
      expect(token.value).to.be('foo');

      // scan second token
      token = lexer.next();
      expect(token.type).to.be(ol.expr.TokenType.PUNCTUATOR);
      expect(token.value).to.be('===');

      // scan third token
      token = lexer.next();
      expect(token.type).to.be(ol.expr.TokenType.STRING_LITERAL);
      expect(token.value).to.be('bar');

      // scan again
      token = lexer.next();
      expect(token.type).to.be(ol.expr.TokenType.EOF);

      // and again
      token = lexer.next();
      expect(token.type).to.be(ol.expr.TokenType.EOF);
    });

  });

  describe('#peek()', function() {

    var lexer;
    beforeEach(function() {
      lexer = new ol.expr.Lexer('foo > 42 && bar == "chicken"');
    });

    it('looks ahead without consuming token', function() {
      var token = lexer.peek();
      expect(token.type).to.be(ol.expr.TokenType.IDENTIFIER);
      expect(token.value).to.be('foo');

      token = lexer.next();
      expect(token.type).to.be(ol.expr.TokenType.IDENTIFIER);
      expect(token.value).to.be('foo');
    });

    it('works after a couple scans', function() {
      var token = lexer.next();
      expect(token.type).to.be(ol.expr.TokenType.IDENTIFIER);
      expect(token.value).to.be('foo');

      token = lexer.next();
      expect(token.type).to.be(ol.expr.TokenType.PUNCTUATOR);
      expect(token.value).to.be('>');

      token = lexer.peek();
      expect(token.type).to.be(ol.expr.TokenType.NUMERIC_LITERAL);
      expect(token.value).to.be(42);

      token = lexer.next();
      expect(token.type).to.be(ol.expr.TokenType.NUMERIC_LITERAL);
      expect(token.value).to.be(42);
    });

    it('returns the same thing when called multiple times', function() {
      var token = lexer.peek();
      expect(token.type).to.be(ol.expr.TokenType.IDENTIFIER);
      expect(token.value).to.be('foo');

      for (var i = 0; i < 10; ++i) {
        token = lexer.peek();
        expect(token.type).to.be(ol.expr.TokenType.IDENTIFIER);
        expect(token.value).to.be('foo');
      }
    });

  });


  describe('#scanIdentifier_()', function() {

    function scan(source, part) {
      var lexer = new ol.expr.Lexer(source);
      var token = lexer.scanIdentifier_(lexer.getCurrentCharCode_());
      if (!part) {
        expect(token.index).to.be(0);
        expect(lexer.peek().type).to.be(ol.expr.TokenType.EOF);
      }
      return token;
    }

    it('works for short identifiers', function() {
      var token = scan('a');
      expect(token.value).to.be('a');
      expect(token.type).to.be(ol.expr.TokenType.IDENTIFIER);
    });

    it('works for longer identifiers', function() {
      var token = scan('foo');
      expect(token.value).to.be('foo');
      expect(token.type).to.be(ol.expr.TokenType.IDENTIFIER);
    });

    it('works for $ anywhere', function() {
      var token = scan('$foo$bar$');
      expect(token.value).to.be('$foo$bar$');
      expect(token.type).to.be(ol.expr.TokenType.IDENTIFIER);
    });

    it('works for _ anywhere', function() {
      var token = scan('_foo_bar_');
      expect(token.value).to.be('_foo_bar_');
      expect(token.type).to.be(ol.expr.TokenType.IDENTIFIER);
    });

    it('works for keywords', function() {
      var token = scan('delete');
      expect(token.value).to.be('delete');
      expect(token.type).to.be(ol.expr.TokenType.KEYWORD);
    });

    it('works for null', function() {
      var token = scan('null');
      expect(token.value).to.be('null');
      expect(token.type).to.be(ol.expr.TokenType.NULL_LITERAL);
    });

    it('works for boolean true', function() {
      var token = scan('true');
      expect(token.value).to.be('true');
      expect(token.type).to.be(ol.expr.TokenType.BOOLEAN_LITERAL);
    });

    it('works for boolean false', function() {
      var token = scan('false');
      expect(token.value).to.be('false');
      expect(token.type).to.be(ol.expr.TokenType.BOOLEAN_LITERAL);
    });

    it('works with unicode escape sequences', function() {
      var token = scan('\u006f\u006c\u0033');
      expect(token.value).to.be('ol3');
      expect(token.type).to.be(ol.expr.TokenType.IDENTIFIER);
    });

    it('works with hex escape sequences', function() {
      var token = scan('\x6f\x6c\x33');
      expect(token.value).to.be('ol3');
      expect(token.type).to.be(ol.expr.TokenType.IDENTIFIER);
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
      var token = scan('foo>bar', true);
      expect(token.value).to.be('foo');
      expect(token.type).to.be(ol.expr.TokenType.IDENTIFIER);
    });

  });

  describe('#scanNumericLiteral_()', function() {

    function scan(source) {
      var lexer = new ol.expr.Lexer(source);
      var token = lexer.scanNumericLiteral_(lexer.getCurrentCharCode_());
      expect(token.index).to.be(0);
      expect(lexer.peek().type).to.be(ol.expr.TokenType.EOF);
      return token;
    }

    it('works for integers', function() {
      var token = scan('123');
      expect(token.value).to.be(123);
      expect(token.type).to.be(ol.expr.TokenType.NUMERIC_LITERAL);
    });

    it('throws for bogus integer', function() {
      expect(function() {
        scan('123z');
      }).throwException(function(err) {
        expect(err).to.be.an(ol.expr.UnexpectedToken);
        var token = err.token;
        expect(token.value).to.be('z');
        expect(token.index).to.be(3);
      });
    });

    it('works for float', function() {
      var token = scan('123.456');
      expect(token.value).to.be(123.456);
      expect(token.type).to.be(ol.expr.TokenType.NUMERIC_LITERAL);
    });

    it('throws for bogus float', function() {
      expect(function() {
        scan('123.4x4');
      }).throwException(function(err) {
        expect(err).to.be.an(ol.expr.UnexpectedToken);
        var token = err.token;
        expect(token.value).to.be('x');
        expect(token.index).to.be(5);
      });
    });

    it('works with exponent', function() {
      var token = scan('1.234e5');
      expect(token.value).to.be(1.234e5);
      expect(token.type).to.be(ol.expr.TokenType.NUMERIC_LITERAL);
    });

    it('works with explicit positive exponent', function() {
      var token = scan('1.234e+5');
      expect(token.value).to.be(1.234e5);
      expect(token.type).to.be(ol.expr.TokenType.NUMERIC_LITERAL);
    });

    it('works with negative exponent', function() {
      var token = scan('1.234e-5');
      expect(token.value).to.be(1.234e-5);
      expect(token.type).to.be(ol.expr.TokenType.NUMERIC_LITERAL);
    });

    it('throws for bogus float', function() {
      expect(function() {
        scan('1.234eo4');
      }).throwException(function(err) {
        expect(err).to.be.an(ol.expr.UnexpectedToken);
        var token = err.token;
        expect(token.value).to.be('o');
        expect(token.index).to.be(6);
      });
    });

    it('works with octals', function() {
      var token = scan('02322');
      expect(token.value).to.be(1234);
      expect(token.type).to.be(ol.expr.TokenType.NUMERIC_LITERAL);
    });

    it('throws for bogus octal', function() {
      // note that this is more strict than most es5 engines
      expect(function() {
        scan('02392');
      }).throwException(function(err) {
        expect(err).to.be.an(ol.expr.UnexpectedToken);
        var token = err.token;
        expect(token.value).to.be('9');
        expect(token.index).to.be(3);
      });
    });

    it('works with hex', function() {
      var token = scan('0x4d2');
      expect(token.value).to.be(1234);
      expect(token.type).to.be(ol.expr.TokenType.NUMERIC_LITERAL);
    });

    it('throws for bogus hex', function() {
      // note that this is more strict than most es5 engines
      expect(function() {
        scan('0x4G');
      }).throwException(function(err) {
        expect(err).to.be.an(ol.expr.UnexpectedToken);
        var token = err.token;
        expect(token.value).to.be('G');
        expect(token.index).to.be(3);
      });
    });

  });

  describe('#scanPunctuator_()', function() {

    function scan(source) {
      var lexer = new ol.expr.Lexer(source);
      var token = lexer.scanPunctuator_(lexer.getCurrentCharCode_());
      expect(token.index).to.be(0);
      expect(lexer.peek().type).to.be(ol.expr.TokenType.EOF);
      return token;
    }

    it('works for dot', function() {
      var token = scan('.');
      expect(token.value).to.be('.');
      expect(token.type).to.be(ol.expr.TokenType.PUNCTUATOR);
    });

    it('works for bang', function() {
      var token = scan('!');
      expect(token.value).to.be('!');
      expect(token.type).to.be(ol.expr.TokenType.PUNCTUATOR);
    });

    it('works for double equal', function() {
      var token = scan('==');
      expect(token.value).to.be('==');
      expect(token.type).to.be(ol.expr.TokenType.PUNCTUATOR);
    });

    it('works for triple equal', function() {
      var token = scan('===');
      expect(token.value).to.be('===');
      expect(token.type).to.be(ol.expr.TokenType.PUNCTUATOR);
    });

    it('works for not double equal', function() {
      var token = scan('!=');
      expect(token.value).to.be('!=');
      expect(token.type).to.be(ol.expr.TokenType.PUNCTUATOR);
    });

    it('works for not triple equal', function() {
      var token = scan('!==');
      expect(token.value).to.be('!==');
      expect(token.type).to.be(ol.expr.TokenType.PUNCTUATOR);
    });

    it('works for logical or', function() {
      var token = scan('||');
      expect(token.value).to.be('||');
      expect(token.type).to.be(ol.expr.TokenType.PUNCTUATOR);
    });

    it('works for logical and', function() {
      var token = scan('&&');
      expect(token.value).to.be('&&');
      expect(token.type).to.be(ol.expr.TokenType.PUNCTUATOR);
    });

    it('works for plus', function() {
      var token = scan('+');
      expect(token.value).to.be('+');
      expect(token.type).to.be(ol.expr.TokenType.PUNCTUATOR);
    });

    it('works for minus', function() {
      var token = scan('-');
      expect(token.value).to.be('-');
      expect(token.type).to.be(ol.expr.TokenType.PUNCTUATOR);
    });

    it('works for star', function() {
      var token = scan('*');
      expect(token.value).to.be('*');
      expect(token.type).to.be(ol.expr.TokenType.PUNCTUATOR);
    });

    it('works for slash', function() {
      var token = scan('/');
      expect(token.value).to.be('/');
      expect(token.type).to.be(ol.expr.TokenType.PUNCTUATOR);
    });

    it('works for percent', function() {
      var token = scan('%');
      expect(token.value).to.be('%');
      expect(token.type).to.be(ol.expr.TokenType.PUNCTUATOR);
    });

  });

  describe('#scanStringLiteral_()', function() {

    function scan(source) {
      var lexer = new ol.expr.Lexer(source);
      var token = lexer.scanStringLiteral_(lexer.getCurrentCharCode_());
      expect(token.index).to.be(0);
      expect(lexer.peek().type).to.be(ol.expr.TokenType.EOF);
      return token;
    }

    it('parses double quoted string', function() {
      var token = scan('"my string"');
      expect(token.value).to.be('my string');
      expect(token.type).to.be(ol.expr.TokenType.STRING_LITERAL);
    });

    it('parses double quoted string with internal single quotes', function() {
      var token = scan('"my \'quoted\' string"');
      expect(token.value).to.be('my \'quoted\' string');
      expect(token.type).to.be(ol.expr.TokenType.STRING_LITERAL);
    });

    it('parses double quoted string with escaped double quotes', function() {
      var token = scan('"my \\"quoted\\" string"');
      expect(token.value).to.be('my "quoted" string');
      expect(token.type).to.be(ol.expr.TokenType.STRING_LITERAL);
    });

    it('parses double quoted string with escaped backslash', function() {
      var token = scan('"my \\\ string"');
      expect(token.value).to.be('my \ string');
      expect(token.type).to.be(ol.expr.TokenType.STRING_LITERAL);
    });

    it('parses double quoted string with unicode escape sequences', function() {
      var token = scan('"\u006f\u006c\u0033"');
      expect(token.value).to.be('ol3');
      expect(token.type).to.be(ol.expr.TokenType.STRING_LITERAL);
    });

    it('parses double quoted string with hex escape sequences', function() {
      var token = scan('"\x6f\x6c\x33"');
      expect(token.value).to.be('ol3');
      expect(token.type).to.be(ol.expr.TokenType.STRING_LITERAL);
    });

    it('parses double quoted string with tab', function() {
      var token = scan('"a\ttab"');
      expect(token.value).to.be('a\ttab');
      expect(token.type).to.be(ol.expr.TokenType.STRING_LITERAL);
    });

    it('throws on unterminated double quote', function() {
      expect(function() {
        scan('"never \'ending\' string');
      }).to.throwException(function(err) {
        expect(err).to.be.an(ol.expr.UnexpectedToken);
        var token = err.token;
        expect(token.type).to.be(ol.expr.TokenType.EOF);
        expect(token.index).to.be(22);
      });
    });

    it('parses single quoted string', function() {
      var token = scan('\'my string\'');
      expect(token.value).to.be('my string');
      expect(token.type).to.be(ol.expr.TokenType.STRING_LITERAL);
    });

    it('parses single quoted string with internal double quotes', function() {
      var token = scan('\'my "quoted" string\'');
      expect(token.value).to.be('my "quoted" string');
      expect(token.type).to.be(ol.expr.TokenType.STRING_LITERAL);
    });

    it('parses single quoted string with escaped single quotes', function() {
      var token = scan('\'my \\\'quoted\\\' string\'');
      expect(token.value).to.be('my \'quoted\' string');
      expect(token.type).to.be(ol.expr.TokenType.STRING_LITERAL);
    });

    it('parses single quoted string with escaped backslash', function() {
      var token = scan('\'my \\\ string\'');
      expect(token.value).to.be('my \ string');
      expect(token.type).to.be(ol.expr.TokenType.STRING_LITERAL);
    });

    it('parses single quoted string with unicode escape sequences', function() {
      var token = scan('\'\u006f\u006c\u0033\'');
      expect(token.value).to.be('ol3');
      expect(token.type).to.be(ol.expr.TokenType.STRING_LITERAL);
    });

    it('parses single quoted string with hex escape sequences', function() {
      var token = scan('\'\x6f\x6c\x33\'');
      expect(token.value).to.be('ol3');
      expect(token.type).to.be(ol.expr.TokenType.STRING_LITERAL);
    });

    it('parses single quoted string with tab', function() {
      var token = scan('\'a\ttab\'');
      expect(token.value).to.be('a\ttab');
      expect(token.type).to.be(ol.expr.TokenType.STRING_LITERAL);
    });

    it('throws on unterminated single quote', function() {
      expect(function() {
        scan('\'never "ending" string');
      }).to.throwException(function(err) {
        expect(err).to.be.an(ol.expr.UnexpectedToken);
        var token = err.token;
        expect(token.type).to.be(ol.expr.TokenType.EOF);
        expect(token.index).to.be(22);
      });
    });

  });

});

goog.require('ol.expr.Lexer');
goog.require('ol.expr.TokenType');
goog.require('ol.expr.UnexpectedToken');
