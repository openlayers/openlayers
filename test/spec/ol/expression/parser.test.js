goog.provide('ol.test.expression.Parser');

describe('ol.expression.Parser', function() {

  describe('constructor', function() {
    it('creates a new expression parser', function() {
      var parser = new ol.expression.Parser();
      expect(parser).to.be.a(ol.expression.Parser);
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
