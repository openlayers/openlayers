goog.provide('ol.test.expression.Lexer');

describe('ol.expression.Lexer', function() {

  describe('constructor', function() {
    it('creates a new lexer', function() {
      var lexer = new ol.expression.Lexer('foo');
      expect(lexer).to.be.a(ol.expression.Lexer);
    });
  });

  describe('#scanNumericLiteral_()', function() {

    function scan(code) {
      var lexer = new ol.expression.Lexer(code);
      return lexer.scanNumericLiteral_();
    }

    it('works for integers', function() {
      var token = scan('123');
      expect(token.value).to.be(123);
    });

    it('works for float', function() {
      var token = scan('123.456');
      expect(token.value).to.be(123.456);
    });

    it('works with exponent', function() {
      var token = scan('1.234e5');
      expect(token.value).to.be(1.234e5);
    });

    it('works with explicit positive exponent', function() {
      var token = scan('1.234e+5');
      expect(token.value).to.be(1.234e5);
    });

    it('works with negative exponent', function() {
      var token = scan('1.234e-5');
      expect(token.value).to.be(1.234e-5);
    });

    it('works with octals', function() {
      var token = scan('02322');
      expect(token.value).to.be(1234);
    });

    it('works with hex', function() {
      var token = scan('0x4d2');
      expect(token.value).to.be(1234);
    });

  });

});

goog.require('ol.expression.Lexer');
