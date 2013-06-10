goog.provide('ol.test.expression');

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
      expect(expr).to.be.a(ol.expression.Expression);
      expect(expr).to.be.a(ol.expression.Math);
      expect(expr.evaluate({foo: 3})).to.be(15);
    });

  });

});


goog.require('ol.expression.Expression');
goog.require('ol.expression.Lexer');
goog.require('ol.expression.Math');
goog.require('ol.expression.Parser');
