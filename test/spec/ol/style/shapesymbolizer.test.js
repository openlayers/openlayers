goog.provide('ol.test.style.Shape');

describe('ol.style.Shape', function() {

  describe('constructor', function() {

    it('accepts literal values', function() {
      var symbolizer = new ol.style.Shape({
        size: 4,
        fillColor: '#BADA55'
      });
      expect(symbolizer).to.be.a(ol.style.Shape);
    });

    it('accepts expressions', function() {
      var symbolizer = new ol.style.Shape({
        size: ol.expr.parse('sizeAttr'),
        strokeColor: ol.expr.parse('color')
      });
      expect(symbolizer).to.be.a(ol.style.Shape);
    });

  });

  describe('#createLiteral()', function() {

    it('evaluates expressions with the given feature', function() {
      var symbolizer = new ol.style.Shape({
        size: ol.expr.parse('sizeAttr'),
        fillOpacity: ol.expr.parse('opacityAttr'),
        fillColor: '#BADA55'
      });

      var feature = new ol.Feature({
        sizeAttr: 42,
        opacityAttr: 0.4
      });

      var literal = symbolizer.createLiteral(feature);
      expect(literal).to.be.a(ol.style.ShapeLiteral);
      expect(literal.size).to.be(42);
      expect(literal.fillOpacity).to.be(0.4);
    });

    it('can be called without a feature', function() {
      var symbolizer = new ol.style.Shape({
        size: 10,
        fillColor: '#BADA55',
        strokeColor: '#013',
        strokeOpacity: 1,
        strokeWidth: 2
      });

      var literal = symbolizer.createLiteral();
      expect(literal).to.be.a(ol.style.ShapeLiteral);
      expect(literal.size).to.be(10);
      expect(literal.fillColor).to.be('#BADA55');
      expect(literal.strokeColor).to.be('#013');
      expect(literal.strokeOpacity).to.be(1);
      expect(literal.strokeWidth).to.be(2);
    });

  });

  describe('#getFillColor()', function() {

    it('returns the fill color', function() {
      var symbolizer = new ol.style.Shape({
        fillColor: '#ff0000'
      });

      var fillColor = symbolizer.getFillColor();
      expect(fillColor).to.be.a(ol.expr.Literal);
      expect(fillColor.getValue()).to.be('#ff0000');
    });

  });

  describe('#getFillOpacity()', function() {

    it('returns the fill opacity', function() {
      var symbolizer = new ol.style.Shape({
        fillOpacity: 0.123
      });

      var opacity = symbolizer.getFillOpacity();
      expect(opacity).to.be.a(ol.expr.Literal);
      expect(opacity.getValue()).to.be(0.123);
    });

    it('returns the default if none provided', function() {
      var symbolizer = new ol.style.Shape({
        fillColor: '#ffffff'
      });

      var opacity = symbolizer.getFillOpacity();
      expect(opacity).to.be.a(ol.expr.Literal);
      expect(opacity.getValue()).to.be(0.4);
    });

  });

  describe('#getStrokeColor()', function() {

    it('returns the stroke color', function() {
      var symbolizer = new ol.style.Shape({
        strokeColor: '#ff0000'
      });

      var strokeColor = symbolizer.getStrokeColor();
      expect(strokeColor).to.be.a(ol.expr.Literal);
      expect(strokeColor.getValue()).to.be('#ff0000');
    });

  });

  describe('#getStrokeOpacity()', function() {

    it('returns the stroke opacity', function() {
      var symbolizer = new ol.style.Shape({
        strokeWidth: 1,
        strokeOpacity: 0.123
      });

      var opacity = symbolizer.getStrokeOpacity();
      expect(opacity).to.be.a(ol.expr.Literal);
      expect(opacity.getValue()).to.be(0.123);
    });

    it('returns the default if none provided', function() {
      var symbolizer = new ol.style.Shape({
        strokeWidth: 1
      });

      var opacity = symbolizer.getStrokeOpacity();
      expect(opacity).to.be.a(ol.expr.Literal);
      expect(opacity.getValue()).to.be(0.8);
    });

  });

  describe('#getStrokeWidth()', function() {

    it('returns the stroke width', function() {
      var symbolizer = new ol.style.Shape({
        strokeWidth: 10
      });

      var strokeWidth = symbolizer.getStrokeWidth();
      expect(strokeWidth).to.be.a(ol.expr.Literal);
      expect(strokeWidth.getValue()).to.be(10);
    });

  });

  describe('#getType()', function() {

    it('returns the shape type', function() {
      var symbolizer = new ol.style.Shape({
        strokeWidth: 1,
        opacity: 0.123
      });

      var type = symbolizer.getType();
      expect(type).to.be(ol.style.ShapeType.CIRCLE);
    });

  });

  describe('#setFillColor()', function() {

    it('sets the fill color', function() {
      var symbolizer = new ol.style.Shape({
        fillColor: '#ff0000'
      });

      symbolizer.setFillColor(new ol.expr.Literal('#0000ff'));

      var fillColor = symbolizer.getFillColor();
      expect(fillColor).to.be.a(ol.expr.Literal);
      expect(fillColor.getValue()).to.be('#0000ff');
    });

    it('throws when not provided an expression', function() {
      var symbolizer = new ol.style.Shape({
        fillColor: '#ff0000'
      });

      expect(function() {
        symbolizer.setFillColor('#0000ff');
      }).throwException(function(err) {
        expect(err).to.be.a(goog.asserts.AssertionError);
      });
    });

  });

  describe('#setFillOpacity()', function() {

    it('sets the fill opacity', function() {
      var symbolizer = new ol.style.Shape({
        fillOpacity: 0.5
      });

      symbolizer.setFillOpacity(new ol.expr.Literal(0.6));

      var fillOpacity = symbolizer.getFillOpacity();
      expect(fillOpacity).to.be.a(ol.expr.Literal);
      expect(fillOpacity.getValue()).to.be(0.6);
    });

    it('throws when not provided an expression', function() {
      var symbolizer = new ol.style.Shape({
        fillOpacity: 0.5
      });

      expect(function() {
        symbolizer.setFillOpacity(0.4);
      }).throwException(function(err) {
        expect(err).to.be.a(goog.asserts.AssertionError);
      });
    });

  });

  describe('#setStrokeColor()', function() {

    it('sets the stroke color', function() {
      var symbolizer = new ol.style.Shape({
        strokeColor: '#ff0000'
      });

      symbolizer.setStrokeColor(new ol.expr.Literal('#0000ff'));

      var strokeColor = symbolizer.getStrokeColor();
      expect(strokeColor).to.be.a(ol.expr.Literal);
      expect(strokeColor.getValue()).to.be('#0000ff');
    });

    it('throws when not provided an expression', function() {
      var symbolizer = new ol.style.Shape({
        strokeColor: '#ff0000'
      });

      expect(function() {
        symbolizer.setStrokeColor('#0000ff');
      }).throwException(function(err) {
        expect(err).to.be.a(goog.asserts.AssertionError);
      });
    });

  });

  describe('#setStrokeOpacity()', function() {

    it('sets the stroke opacity', function() {
      var symbolizer = new ol.style.Shape({
        strokeWidth: 1,
        strokeOpacity: 0.123
      });
      symbolizer.setStrokeOpacity(new ol.expr.Literal(0.321));

      var opacity = symbolizer.getStrokeOpacity();
      expect(opacity).to.be.a(ol.expr.Literal);
      expect(opacity.getValue()).to.be(0.321);
    });

    it('throws when not provided an expression', function() {
      var symbolizer = new ol.style.Shape({
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

  describe('#setStrokeWidth()', function() {

    it('sets the stroke width', function() {
      var symbolizer = new ol.style.Shape({
        strokeWidth: 10
      });
      symbolizer.setStrokeWidth(new ol.expr.Literal(20));

      var strokeWidth = symbolizer.getStrokeWidth();
      expect(strokeWidth).to.be.a(ol.expr.Literal);
      expect(strokeWidth.getValue()).to.be(20);
    });

    it('throws when not provided an expression', function() {
      var symbolizer = new ol.style.Shape({
        strokeWidth: 10
      });

      expect(function() {
        symbolizer.setStrokeWidth(10);
      }).throwException(function(err) {
        expect(err).to.be.a(goog.asserts.AssertionError);
      });
    });

  });

  describe('#setType()', function() {

    it('sets the shape type', function() {
      var symbolizer = new ol.style.Shape({
        strokeWidth: 1,
        opacity: 0.123
      });
      symbolizer.setType(ol.style.ShapeType.CIRCLE);

      var type = symbolizer.getType();
      expect(type).to.be(ol.style.ShapeType.CIRCLE);
    });

  });

});

goog.require('goog.asserts.AssertionError');

goog.require('ol.Feature');
goog.require('ol.expr');
goog.require('ol.expr.Literal');
goog.require('ol.style.Shape');
goog.require('ol.style.ShapeLiteral');
goog.require('ol.style.ShapeType');
