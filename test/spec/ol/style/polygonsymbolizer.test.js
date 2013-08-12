goog.provide('ol.test.style.Polygon');

describe('ol.style.Polygon', function() {

  describe('constructor', function() {

    it('accepts literal values', function() {
      var symbolizer = new ol.style.Polygon({
        fillColor: '#BADA55',
        strokeWidth: 3
      });
      expect(symbolizer).to.be.a(ol.style.Polygon);
    });

    it('accepts expressions', function() {
      var symbolizer = new ol.style.Polygon({
        fillOpacity: ol.expr.parse('value / 100'),
        fillColor: ol.expr.parse('fillAttr')
      });
      expect(symbolizer).to.be.a(ol.style.Polygon);
    });

  });

  describe('#createLiteral()', function() {

    it('evaluates expressions with the given feature', function() {
      var symbolizer = new ol.style.Polygon({
        fillOpacity: ol.expr.parse('value / 100'),
        fillColor: ol.expr.parse('fillAttr')
      });

      var feature = new ol.Feature({
        value: 42,
        fillAttr: '#ff0000'
      });

      var literal = symbolizer.createLiteral(feature);
      expect(literal).to.be.a(ol.style.PolygonLiteral);
      expect(literal.fillOpacity).to.be(42 / 100);
      expect(literal.fillColor).to.be('#ff0000');
      expect(literal.strokeColor).to.be(undefined);
    });

    it('applies default strokeWidth if only strokeColor is given', function() {
      var symbolizer = new ol.style.Polygon({
        strokeColor: '#ff0000'
      });

      var literal = symbolizer.createLiteral();
      expect(literal).to.be.a(ol.style.PolygonLiteral);
      expect(literal.strokeColor).to.be('#ff0000');
      expect(literal.strokeWidth).to.be(1.5);
      expect(literal.fillColor).to.be(undefined);
    });

  });

  describe('#getFillColor()', function() {

    it('returns the fill color', function() {
      var symbolizer = new ol.style.Polygon({
        fillColor: '#ff0000'
      });

      var fillColor = symbolizer.getFillColor();
      expect(fillColor).to.be.a(ol.expr.Literal);
      expect(fillColor.getValue()).to.be('#ff0000');
    });

  });

  describe('#getFillOpacity()', function() {

    it('returns the fill opacity', function() {
      var symbolizer = new ol.style.Polygon({
        fillColor: '#ffffff',
        fillOpacity: 0.123
      });

      var opacity = symbolizer.getFillOpacity();
      expect(opacity).to.be.a(ol.expr.Literal);
      expect(opacity.getValue()).to.be(0.123);
    });

  });

  describe('#getStrokeColor()', function() {

    it('returns the stroke color', function() {
      var symbolizer = new ol.style.Polygon({
        strokeColor: '#ff0000'
      });

      var strokeColor = symbolizer.getStrokeColor();
      expect(strokeColor).to.be.a(ol.expr.Literal);
      expect(strokeColor.getValue()).to.be('#ff0000');
    });

  });

  describe('#getStrokeWidth()', function() {

    it('returns the stroke width', function() {
      var symbolizer = new ol.style.Polygon({
        strokeWidth: 10
      });

      var strokeWidth = symbolizer.getStrokeWidth();
      expect(strokeWidth).to.be.a(ol.expr.Literal);
      expect(strokeWidth.getValue()).to.be(10);
    });

  });

  describe('#getStrokeOpacity()', function() {

    it('returns the stroke opacity', function() {
      var symbolizer = new ol.style.Polygon({
        strokeWidth: 1,
        strokeOpacity: 0.123
      });

      var opacity = symbolizer.getStrokeOpacity();
      expect(opacity).to.be.a(ol.expr.Literal);
      expect(opacity.getValue()).to.be(0.123);
    });

  });

  describe('#setFillColor()', function() {

    it('sets the fill color', function() {
      var symbolizer = new ol.style.Polygon({
        fillColor: '#ff0000'
      });

      symbolizer.setFillColor(new ol.expr.Literal('#0000ff'));

      var fillColor = symbolizer.getFillColor();
      expect(fillColor).to.be.a(ol.expr.Literal);
      expect(fillColor.getValue()).to.be('#0000ff');
    });

    it('throws when not provided an expression', function() {
      var symbolizer = new ol.style.Polygon({
        fillColor: '#ff0000'
      });

      expect(function() {
        symbolizer.setFillColor('#0000ff');
      }).throwException(function(err) {
        expect(err).to.be.a(goog.asserts.AssertionError);
      });
    });

  });

  describe('#setStrokeColor()', function() {

    it('sets the stroke color', function() {
      var symbolizer = new ol.style.Polygon({
        strokeColor: '#ff0000'
      });

      symbolizer.setStrokeColor(new ol.expr.Literal('#0000ff'));

      var strokeColor = symbolizer.getStrokeColor();
      expect(strokeColor).to.be.a(ol.expr.Literal);
      expect(strokeColor.getValue()).to.be('#0000ff');
    });

    it('throws when not provided an expression', function() {
      var symbolizer = new ol.style.Polygon({
        strokeColor: '#ff0000'
      });

      expect(function() {
        symbolizer.setStrokeColor('#0000ff');
      }).throwException(function(err) {
        expect(err).to.be.a(goog.asserts.AssertionError);
      });
    });

  });

  describe('#setStrokeWidth()', function() {

    it('sets the stroke width', function() {
      var symbolizer = new ol.style.Polygon({
        strokeWidth: 10
      });
      symbolizer.setStrokeWidth(new ol.expr.Literal(20));

      var strokeWidth = symbolizer.getStrokeWidth();
      expect(strokeWidth).to.be.a(ol.expr.Literal);
      expect(strokeWidth.getValue()).to.be(20);
    });

    it('throws when not provided an expression', function() {
      var symbolizer = new ol.style.Polygon({
        strokeWidth: 10
      });

      expect(function() {
        symbolizer.setStrokeWidth(10);
      }).throwException(function(err) {
        expect(err).to.be.a(goog.asserts.AssertionError);
      });
    });

  });

  describe('#setStrokeOpacity()', function() {

    it('sets the stroke opacity', function() {
      var symbolizer = new ol.style.Polygon({
        strokeWidth: 1,
        strokeOpacity: 0.123
      });
      symbolizer.setStrokeOpacity(new ol.expr.Literal(0.321));

      var opacity = symbolizer.getStrokeOpacity();
      expect(opacity).to.be.a(ol.expr.Literal);
      expect(opacity.getValue()).to.be(0.321);
    });

    it('throws when not provided an expression', function() {
      var symbolizer = new ol.style.Polygon({
        strokeWidth: 1,
        strokeOpacity: 1
      });

      expect(function() {
        symbolizer.setStrokeOpacity(0.5);
      }).throwException(function(err) {
        expect(err).to.be.a(goog.asserts.AssertionError);
      });
    });

  });

});

goog.require('goog.asserts.AssertionError');

goog.require('ol.Feature');
goog.require('ol.expr');
goog.require('ol.expr.Literal');
goog.require('ol.style.Polygon');
goog.require('ol.style.PolygonLiteral');
