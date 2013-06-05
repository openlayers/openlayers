goog.provide('ol.test.expression.Lexer');

describe('ol.expression.Lexer', function() {

  describe('constructor', function() {
    it('creates a new lexer', function() {
      var lexer = new ol.expression.Lexer('foo');
      expect(lexer).to.be.a(ol.expression.Lexer);
    });
  });

});

goog.require('ol.expression.Lexer');
