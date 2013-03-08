goog.provide('ol.test.style.Polygon');

describe('ol.style.PolygonLiteral', function() {

  describe('#equals()', function() {

    it('identifies equal literals', function() {
      var literal = new ol.style.PolygonLiteral({
        strokeWidth: 3,
        strokeColor: '#013',
        fillColor: '#BADA55',
        opacity: 1
      });
      var equalLiteral = new ol.style.PolygonLiteral({
        fillColor: '#BADA55',
        strokeColor: '#013',
        strokeWidth: 3,
        opacity: 1
      });
      var differentLiteral = new ol.style.PolygonLiteral({
        fillColor: '#013',
        strokeColor: '#013',
        strokeWidth: 3,
        opacity: 1
      });
      expect(literal.equals(equalLiteral)).toBe(true);
      expect(literal.equals(differentLiteral)).toBe(false);
    });

  });

});

describe('ol.style.Polygon', function() {

  describe('constructor', function() {

    it('accepts literal values', function() {
      var symbolizer = new ol.style.Polygon({
        fillColor: '#BADA55',
        strokeWidth: 3
      });
      expect(symbolizer).toBeA(ol.style.Polygon);
    });

    it('accepts expressions', function() {
      var symbolizer = new ol.style.Polygon({
        opacity: new ol.Expression('value / 100'),
        fillColor: new ol.Expression('fillAttr')
      });
      expect(symbolizer).toBeA(ol.style.Polygon);
    });

  });

  describe('#createLiteral()', function() {

    it('evaluates expressions with the given feature', function() {
      var symbolizer = new ol.style.Polygon({
        opacity: new ol.Expression('value / 100'),
        fillColor: new ol.Expression('fillAttr')
      });

      var feature = new ol.Feature({
        value: 42,
        fillAttr: '#ff0000'
      });

      var literal = symbolizer.createLiteral(feature);
      expect(literal).toBeA(ol.style.PolygonLiteral);
      expect(literal.opacity).toBe(42 / 100);
      expect(literal.fillColor).toBe('#ff0000');
      expect(literal.strokeColor).toBeUndefined();
    });

    it('applies default strokeWidth if only strokeColor is given', function() {
      var symbolizer = new ol.style.Polygon({
        strokeColor: '#ff0000'
      });

      var literal = symbolizer.createLiteral();
      expect(literal).toBeA(ol.style.PolygonLiteral);
      expect(literal.strokeColor).toBe('#ff0000');
      expect(literal.strokeWidth).toBe(1.5);
      expect(literal.fillColor).toBeUndefined();
    });

  });

});

goog.require('ol.Expression');
goog.require('ol.Feature');
goog.require('ol.style.Polygon');
goog.require('ol.style.PolygonLiteral');
