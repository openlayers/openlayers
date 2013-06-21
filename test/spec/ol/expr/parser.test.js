goog.provide('ol.test.expression.Parser');

describe('ol.expr.Parser', function() {

  describe('constructor', function() {
    it('creates a new expression parser', function() {
      var parser = new ol.expr.Parser();
      expect(parser).to.be.a(ol.expr.Parser);
    });
  });

  describe('#parseArguments_()', function() {

    function parse(source) {
      var lexer = new ol.expr.Lexer(source);
      var parser = new ol.expr.Parser();
      var expr = parser.parseArguments_(lexer);
      expect(lexer.peek().type).to.be(ol.expr.TokenType.EOF);
      return expr;
    }

    it('parses comma separated expressions in parens', function() {
      var args = parse('(1/3, "foo", true)');
      expect(args).length(3);

      expect(args[0]).to.be.a(ol.expr.Math);
      expect(args[0].evaluate()).to.be(1 / 3);

      expect(args[1]).to.be.a(ol.expr.Literal);
      expect(args[1].evaluate()).to.be('foo');

      expect(args[2]).to.be.a(ol.expr.Literal);
      expect(args[2].evaluate()).to.be(true);
    });

    it('throws on invalid arg expression', function() {
      expect(function() {
        parse('(6e)');
      }).throwException();
    });

    it('throws on unterminated args', function() {
      expect(function() {
        parse('("foo", 42, )');
      }).throwException();
    });

  });

  describe('#parseBinaryExpression_()', function() {

    function parse(source) {
      var lexer = new ol.expr.Lexer(source);
      var parser = new ol.expr.Parser();
      var expr = parser.parseBinaryExpression_(lexer);
      expect(lexer.peek().type).to.be(ol.expr.TokenType.EOF);
      return expr;
    }

    it('works with multiplicitave operators', function() {
      var expr = parse('4 * 1e4');
      expect(expr).to.be.a(ol.expr.Math);
      expect(expr.evaluate()).to.be(40000);

      expect(parse('10/3').evaluate()).to.be(10 / 3);
    });

    it('works with additive operators', function() {
      var expr = parse('4 +1e4');
      expect(expr).to.be.a(ol.expr.Math);
      expect(expr.evaluate()).to.be(10004);

      expect(parse('10-3').evaluate()).to.be(7);
    });

    it('works with relational operators', function() {
      var expr = parse('4 < 1e4');
      expect(expr).to.be.a(ol.expr.Comparison);
      expect(expr.evaluate()).to.be(true);

      expect(parse('10<3').evaluate()).to.be(false);
      expect(parse('10 <= "10"').evaluate()).to.be(true);
      expect(parse('10 > "10"').evaluate()).to.be(false);
      expect(parse('10 >= 9').evaluate()).to.be(true);
    });

    it('works with equality operators', function() {
      var expr = parse('4 == 1e4');
      expect(expr).to.be.a(ol.expr.Comparison);
      expect(expr.evaluate()).to.be(false);

      expect(parse('10!=3').evaluate()).to.be(true);
      expect(parse('10 == "10"').evaluate()).to.be(true);
      expect(parse('10 === "10"').evaluate()).to.be(false);
      expect(parse('10 !== "10"').evaluate()).to.be(true);
    });

    it('works with binary logical operators', function() {
      var expr = parse('true && false');
      expect(expr).to.be.a(ol.expr.Logical);
      expect(expr.evaluate()).to.be(false);

      expect(parse('false||true').evaluate()).to.be(true);
      expect(parse('false || false').evaluate()).to.be(false);
      expect(parse('true &&true').evaluate()).to.be(true);
    });

    it('throws for invalid binary expression', function() {
      expect(function() {
        parse('4 * / 2');
      }).throwException();

      expect(function() {
        parse('4 < / 2');
      }).throwException();

      expect(function() {
        parse('4 * && 2');
      }).throwException();

    });

  });

  describe('#parseGroupExpression_()', function() {

    function parse(source) {
      var lexer = new ol.expr.Lexer(source);
      var parser = new ol.expr.Parser();
      var expr = parser.parseGroupExpression_(lexer);
      expect(lexer.peek().type).to.be(ol.expr.TokenType.EOF);
      return expr;
    }

    it('parses grouped expressions', function() {
      var expr = parse('(3 * (foo + 2))');
      expect(expr).to.be.a(ol.expr.Math);
      expect(expr.evaluate({foo: 3})).to.be(15);
    });

  });

  describe('#parseLeftHandSideExpression_()', function() {

    function parse(source) {
      var lexer = new ol.expr.Lexer(source);
      var parser = new ol.expr.Parser();
      var expr = parser.parseLeftHandSideExpression_(lexer);
      expect(lexer.peek().type).to.be(ol.expr.TokenType.EOF);
      return expr;
    }

    it('parses member expressions', function() {
      var expr = parse('foo.bar.bam');
      expect(expr).to.be.a(ol.expr.Member);
    });

    it('throws on invalid member expression', function() {
      expect(function() {
        parse('foo.4');
      }).throwException();
    });

    it('parses call expressions', function() {
      var expr = parse('foo(bar)');
      expect(expr).to.be.a(ol.expr.Call);
      var fns = {
        foo: function(arg) {
          expect(arguments).length(1);
          expect(arg).to.be('chicken');
          return 'got ' + arg;
        }
      };
      var scope = {
        bar: 'chicken'
      };
      expect(expr.evaluate(scope, fns)).to.be('got chicken');
    });

    it('throws on invalid call expression', function() {
      expect(function() {
        parse('foo(*)');
      }).throwException();
    });

  });


  describe('#parsePrimaryExpression_()', function() {

    function parse(source) {
      var lexer = new ol.expr.Lexer(source);
      var parser = new ol.expr.Parser();
      var expr = parser.parsePrimaryExpression_(lexer);
      expect(lexer.peek().type).to.be(ol.expr.TokenType.EOF);
      return expr;
    }

    it('parses string literal', function() {
      var expr = parse('"foo"');
      expect(expr).to.be.a(ol.expr.Literal);
      expect(expr.evaluate()).to.be('foo');
    });

    it('parses numeric literal', function() {
      var expr = parse('.42e2');
      expect(expr).to.be.a(ol.expr.Literal);
      expect(expr.evaluate()).to.be(42);
    });

    it('parses boolean literal', function() {
      var expr = parse('.42e2');
      expect(expr).to.be.a(ol.expr.Literal);
      expect(expr.evaluate()).to.be(42);
    });

    it('parses null literal', function() {
      var expr = parse('null');
      expect(expr).to.be.a(ol.expr.Literal);
      expect(expr.evaluate()).to.be(null);
    });

  });

  describe('#parseUnaryExpression_()', function() {

    function parse(source) {
      var lexer = new ol.expr.Lexer(source);
      var parser = new ol.expr.Parser();
      var expr = parser.parseUnaryExpression_(lexer);
      expect(lexer.peek().type).to.be(ol.expr.TokenType.EOF);
      return expr;
    }

    it('parses logical not', function() {
      var expr = parse('!foo');
      expect(expr).to.be.a(ol.expr.Not);
      expect(expr.evaluate({foo: true})).to.be(false);
    });

    it('works with string literal', function() {
      var expr = parse('!"foo"');
      expect(expr).to.be.a(ol.expr.Not);
      expect(expr.evaluate()).to.be(false);
    });

    it('works with empty string', function() {
      var expr = parse('!""');
      expect(expr).to.be.a(ol.expr.Not);
      expect(expr.evaluate()).to.be(true);
    });

    it('works with null', function() {
      var expr = parse('!null');
      expect(expr).to.be.a(ol.expr.Not);
      expect(expr.evaluate()).to.be(true);
    });

  });


});


goog.require('ol.expr.Expression');
goog.require('ol.expr.Call');
goog.require('ol.expr.Comparison');
goog.require('ol.expr.Lexer');
goog.require('ol.expr.Literal');
goog.require('ol.expr.Logical');
goog.require('ol.expr.Math');
goog.require('ol.expr.Member');
goog.require('ol.expr.Not');
goog.require('ol.expr.Parser');
goog.require('ol.expr.TokenType');
