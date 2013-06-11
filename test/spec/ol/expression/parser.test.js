goog.provide('ol.test.expression.Parser');

describe('ol.expression.Parser', function() {

  describe('constructor', function() {
    it('creates a new expression parser', function() {
      var parser = new ol.expression.Parser();
      expect(parser).to.be.a(ol.expression.Parser);
    });
  });

  describe('#parseArguments_()', function() {

    function parse(source) {
      var lexer = new ol.expression.Lexer(source);
      var parser = new ol.expression.Parser();
      return parser.parseArguments_(lexer);
    }

    it('parses comma separated expressions in parens', function() {
      var args = parse('(1/3, "foo", true)');
      expect(args).length(3);

      expect(args[0]).to.be.a(ol.expression.Math);
      expect(args[0].evaluate()).to.be(1 / 3);

      expect(args[1]).to.be.a(ol.expression.Literal);
      expect(args[1].evaluate()).to.be('foo');

      expect(args[2]).to.be.a(ol.expression.Literal);
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
      var lexer = new ol.expression.Lexer(source);
      var parser = new ol.expression.Parser();
      return parser.parseBinaryExpression_(lexer);
    }

    it('works with multiplicitave operators', function() {
      var expr = parse('4 * 1e4');
      expect(expr).to.be.a(ol.expression.Math);
      expect(expr.evaluate()).to.be(40000);

      expect(parse('10/3').evaluate()).to.be(10 / 3);
    });

    it('works with additive operators', function() {
      var expr = parse('4 +1e4');
      expect(expr).to.be.a(ol.expression.Math);
      expect(expr.evaluate()).to.be(10004);

      expect(parse('10-3').evaluate()).to.be(7);
    });

    it('works with relational operators', function() {
      var expr = parse('4 < 1e4');
      expect(expr).to.be.a(ol.expression.Comparison);
      expect(expr.evaluate()).to.be(true);

      expect(parse('10<3').evaluate()).to.be(false);
      expect(parse('10 <= "10"').evaluate()).to.be(true);
      expect(parse('10 > "10"').evaluate()).to.be(false);
      expect(parse('10 >= 9').evaluate()).to.be(true);
    });

    it('works with equality operators', function() {
      var expr = parse('4 == 1e4');
      expect(expr).to.be.a(ol.expression.Comparison);
      expect(expr.evaluate()).to.be(false);

      expect(parse('10!=3').evaluate()).to.be(true);
      expect(parse('10 == "10"').evaluate()).to.be(true);
      expect(parse('10 === "10"').evaluate()).to.be(false);
      expect(parse('10 !== "10"').evaluate()).to.be(true);
    });

    it('works with binary logical operators', function() {
      var expr = parse('true && false');
      expect(expr).to.be.a(ol.expression.Logical);
      expect(expr.evaluate()).to.be(false);

      expect(parse('false||true').evaluate()).to.be(true);
      expect(parse('false || false').evaluate()).to.be(false);
      expect(parse('true &&true').evaluate()).to.be(true);
    });

    it('throws for invalid binary expression', function() {
      expect(function() {
        parse('4 * / 2');
      }).throwException();
    });

  });

  describe('#parseGroupExpression_()', function() {

    function parse(source) {
      var lexer = new ol.expression.Lexer(source);
      var parser = new ol.expression.Parser();
      return parser.parseGroupExpression_(lexer);
    }

    it('parses grouped expressions', function() {
      var expr = parse('(3 * (foo + 2))');
      expect(expr).to.be.a(ol.expression.Math);
      expect(expr.evaluate({foo: 3})).to.be(15);
    });

  });

  describe('#parsePrimaryExpression_()', function() {

    function parse(source) {
      var lexer = new ol.expression.Lexer(source);
      var parser = new ol.expression.Parser();
      return parser.parsePrimaryExpression_(lexer);
    }

    it('parses string literal', function() {
      var expr = parse('"foo"');
      expect(expr).to.be.a(ol.expression.Literal);
      expect(expr.evaluate()).to.be('foo');
    });

    it('parses numeric literal', function() {
      var expr = parse('.42e2');
      expect(expr).to.be.a(ol.expression.Literal);
      expect(expr.evaluate()).to.be(42);
    });

    it('parses boolean literal', function() {
      var expr = parse('.42e2');
      expect(expr).to.be.a(ol.expression.Literal);
      expect(expr.evaluate()).to.be(42);
    });

    it('parses null literal', function() {
      var expr = parse('null');
      expect(expr).to.be.a(ol.expression.Literal);
      expect(expr.evaluate()).to.be(null);
    });

  });


});


goog.require('ol.expression.Expression');
goog.require('ol.expression.Lexer');
goog.require('ol.expression.Math');
goog.require('ol.expression.Parser');
