goog.provide('ol.test.style.Stroke');

describe('ol.style.Stroke', function() {

  describe('constructor', function() {

    it('accepts literal values', function() {
      var symbolizer = new ol.style.Stroke({
        color: '#BADA55',
        width: 3
      });
      expect(symbolizer).to.be.a(ol.style.Stroke);
    });

    it('accepts expressions', function() {
      var symbolizer = new ol.style.Stroke({
        opacity: ol.expr.parse('value / 100'),
        width: ol.expr.parse('widthAttr')
      });
      expect(symbolizer).to.be.a(ol.style.Stroke);
    });

    it('accepts zIndex', function() {
      var symbolizer = new ol.style.Stroke({
        opacity: ol.expr.parse('value / 100'),
        width: ol.expr.parse('widthAttr'),
        zIndex: 5
      });
      expect(symbolizer).to.be.a(ol.style.Stroke);
    });

  });

  describe('#createLiteral()', function() {

    it('evaluates expressions with the given feature', function() {
      var symbolizer = new ol.style.Stroke({
        opacity: ol.expr.parse('value / 100'),
        width: ol.expr.parse('widthAttr')
      });

      var feature = new ol.Feature({
        value: 42,
        widthAttr: 1.5,
        geometry: new ol.geom.LineString([[1, 2], [3, 4]])
      });

      var literal = symbolizer.createLiteral(feature);
      expect(literal).to.be.a(ol.style.LineLiteral);
      expect(literal.opacity).to.be(42 / 100);
      expect(literal.width).to.be(1.5);
      expect(literal.zIndex).to.be(0);
    });

    it('applies the default values', function() {
      var symbolizer = new ol.style.Stroke({});

      var literal = symbolizer.createLiteral(ol.geom.GeometryType.LINE_STRING);
      expect(literal).to.be.a(ol.style.LineLiteral);
      expect(literal.color).to.be('#696969');
      expect(literal.opacity).to.be(0.75);
      expect(literal.width).to.be(1.5);
      expect(literal.zIndex).to.be(0);
    });

  });

  describe('#getColor()', function() {

    it('returns the stroke color', function() {
      var symbolizer = new ol.style.Stroke({
        color: '#ff0000'
      });

      var color = symbolizer.getColor();
      expect(color).to.be.a(ol.expr.Literal);
      expect(color.getValue()).to.be('#ff0000');
    });

  });

  describe('#getWidth()', function() {

    it('returns the stroke width', function() {
      var symbolizer = new ol.style.Stroke({
        width: 10
      });

      var width = symbolizer.getWidth();
      expect(width).to.be.a(ol.expr.Literal);
      expect(width.getValue()).to.be(10);
    });

  });

  describe('#getOpacity()', function() {

    it('returns the stroke opacity', function() {
      var symbolizer = new ol.style.Stroke({
        opacity: 0.123
      });

      var opacity = symbolizer.getOpacity();
      expect(opacity).to.be.a(ol.expr.Literal);
      expect(opacity.getValue()).to.be(0.123);
    });

  });

  describe('#setColor()', function() {

    it('sets the stroke color', function() {
      var symbolizer = new ol.style.Stroke({
        color: '#ff0000'
      });

      symbolizer.setColor(new ol.expr.Literal('#0000ff'));

      var color = symbolizer.getColor();
      expect(color).to.be.a(ol.expr.Literal);
      expect(color.getValue()).to.be('#0000ff');
    });

    it('throws when not provided an expression', function() {
      var symbolizer = new ol.style.Stroke({
        color: '#ff0000'
      });

      expect(function() {
        symbolizer.setColor('#0000ff');
      }).throwException(function(err) {
        expect(err).to.be.a(goog.asserts.AssertionError);
      });
    });

  });

  describe('#setWidth()', function() {

    it('sets the stroke width', function() {
      var symbolizer = new ol.style.Stroke({
        width: 10
      });
      symbolizer.setWidth(new ol.expr.Literal(20));

      var width = symbolizer.getWidth();
      expect(width).to.be.a(ol.expr.Literal);
      expect(width.getValue()).to.be(20);
    });

    it('throws when not provided an expression', function() {
      var symbolizer = new ol.style.Stroke({
        width: 10
      });

      expect(function() {
        symbolizer.setWidth(10);
      }).throwException(function(err) {
        expect(err).to.be.a(goog.asserts.AssertionError);
      });
    });

  });

  describe('#setOpacity()', function() {

    it('sets the stroke opacity', function() {
      var symbolizer = new ol.style.Stroke({
        opacity: 0.123
      });
      symbolizer.setOpacity(new ol.expr.Literal(0.321));

      var opacity = symbolizer.getOpacity();
      expect(opacity).to.be.a(ol.expr.Literal);
      expect(opacity.getValue()).to.be(0.321);
    });

    it('throws when not provided an expression', function() {
      var symbolizer = new ol.style.Stroke({
        opacity: 1
      });

      expect(function() {
        symbolizer.setOpacity(0.5);
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
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.style.Stroke');
goog.require('ol.style.LineLiteral');
