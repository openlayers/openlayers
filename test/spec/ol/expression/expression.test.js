goog.provide('ol.test.expression.Expression');


describe('ol.expression.BooleanLiteral', function() {

  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expression.BooleanLiteral(true);
      expect(expr).to.be.a(ol.expression.Expression);
      expect(expr).to.be.a(ol.expression.BooleanLiteral);
    });
  });

});


describe('ol.expression.Identifier', function() {

  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expression.Identifier('foo');
      expect(expr).to.be.a(ol.expression.Expression);
      expect(expr).to.be.a(ol.expression.Identifier);
    });
  });

});

describe('ol.expression.Not', function() {

  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expression.Not(
          new ol.expression.BooleanLiteral(true));
      expect(expr).to.be.a(ol.expression.Expression);
      expect(expr).to.be.a(ol.expression.Not);
    });
  });

});

describe('ol.expression.NullLiteral', function() {

  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expression.NullLiteral();
      expect(expr).to.be.a(ol.expression.Expression);
      expect(expr).to.be.a(ol.expression.NullLiteral);
    });
  });

});

describe('ol.expression.NumericLiteral', function() {

  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expression.NumericLiteral(42);
      expect(expr).to.be.a(ol.expression.Expression);
      expect(expr).to.be.a(ol.expression.NumericLiteral);
    });
  });

});

describe('ol.expression.StringLiteral', function() {

  describe('constructor', function() {
    it('creates a new expression', function() {
      var expr = new ol.expression.StringLiteral('bar');
      expect(expr).to.be.a(ol.expression.Expression);
      expect(expr).to.be.a(ol.expression.StringLiteral);
    });
  });

});


goog.require('ol.expression.BooleanLiteral');
goog.require('ol.expression.Expression');
goog.require('ol.expression.Identifier');
goog.require('ol.expression.Not');
goog.require('ol.expression.NullLiteral');
goog.require('ol.expression.NumericLiteral');
goog.require('ol.expression.StringLiteral');
