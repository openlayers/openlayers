goog.provide('ol.test.style.Fill');

describe('ol.style.Fill', function() {

  describe('constructor', function() {

    it('accepts literal values', function() {
      var symbolizer = new ol.style.Fill({
        color: '#BADA55'
      });
      expect(symbolizer).to.be.a(ol.style.Fill);
    });

    it('accepts expressions', function() {
      var symbolizer = new ol.style.Fill({
        opacity: ol.expr.parse('value / 100'),
        color: ol.expr.parse('fillAttr')
      });
      expect(symbolizer).to.be.a(ol.style.Fill);
    });

  });

  describe('#createLiteral()', function() {

    it('evaluates expressions with the given feature', function() {
      var symbolizer = new ol.style.Fill({
        opacity: ol.expr.parse('value / 100'),
        color: ol.expr.parse('fillAttr')
      });

      var feature = new ol.Feature({
        value: 42,
        fillAttr: '#ff0000',
        geometry: new ol.geom.Polygon(
            [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]])
      });

      var literal = symbolizer.createLiteral(feature);
      expect(literal).to.be.a(ol.style.PolygonLiteral);
      expect(literal.fillOpacity).to.be(42 / 100);
      expect(literal.fillColor).to.be('#ff0000');
    });

    it('applies default opacity', function() {
      var symbolizer = new ol.style.Fill({
        color: '#ff0000'
      });

      var literal = symbolizer.createLiteral(ol.geom.GeometryType.POLYGON);
      expect(literal).to.be.a(ol.style.PolygonLiteral);
      expect(literal.fillColor).to.be('#ff0000');
      expect(literal.fillOpacity).to.be(0.4);
    });

    it('applies default color', function() {
      var symbolizer = new ol.style.Fill({
        opacity: 0.8
      });

      var literal = symbolizer.createLiteral(ol.geom.GeometryType.POLYGON);
      expect(literal).to.be.a(ol.style.PolygonLiteral);
      expect(literal.fillColor).to.be('#ffffff');
      expect(literal.fillOpacity).to.be(0.8);
    });

    it('casts opacity to number', function() {
      var symbolizer = new ol.style.Fill({
        opacity: ol.expr.parse('opacity'),
        color: '#ff00ff'
      });

      var feature = new ol.Feature({
        opacity: '0.55',
        geometry: new ol.geom.Polygon(
            [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]])
      });

      var literal = symbolizer.createLiteral(feature);
      expect(literal).to.be.a(ol.style.PolygonLiteral);
      expect(literal.fillOpacity).to.be(0.55);
    });

  });

  describe('#getColor()', function() {

    it('returns the fill color', function() {
      var symbolizer = new ol.style.Fill({
        color: '#ff0000'
      });

      var color = symbolizer.getColor();
      expect(color).to.be.a(ol.expr.Literal);
      expect(color.getValue()).to.be('#ff0000');
    });

  });

  describe('#getOpacity()', function() {

    it('returns the fill opacity', function() {
      var symbolizer = new ol.style.Fill({
        color: '#ffffff',
        opacity: 0.123
      });

      var opacity = symbolizer.getOpacity();
      expect(opacity).to.be.a(ol.expr.Literal);
      expect(opacity.getValue()).to.be(0.123);
    });

  });

  describe('#setColor()', function() {

    it('sets the fill color', function() {
      var symbolizer = new ol.style.Fill({
        color: '#ff0000'
      });

      symbolizer.setColor(new ol.expr.Literal('#0000ff'));

      var color = symbolizer.getColor();
      expect(color).to.be.a(ol.expr.Literal);
      expect(color.getValue()).to.be('#0000ff');
    });

    it('throws when not provided an expression', function() {
      var symbolizer = new ol.style.Fill({
        color: '#ff0000'
      });

      expect(function() {
        symbolizer.setColor('#0000ff');
      }).throwException(function(err) {
        expect(err).to.be.a(goog.asserts.AssertionError);
      });
    });

  });

  describe('#setOpacity()', function() {

    it('sets the fill opacity', function() {
      var symbolizer = new ol.style.Fill({
        color: '#ff0000'
      });

      symbolizer.setOpacity(new ol.expr.Literal(0.321));

      var opacity = symbolizer.getOpacity();
      expect(opacity).to.be.a(ol.expr.Literal);
      expect(opacity.getValue()).to.be(0.321);
    });

    it('throws when not provided an expression', function() {
      var symbolizer = new ol.style.Fill({
        color: '#ff0000'
      });

      expect(function() {
        symbolizer.setOpacity(0.123);
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
goog.require('ol.geom.Polygon');
goog.require('ol.style.Fill');
goog.require('ol.style.PolygonLiteral');
