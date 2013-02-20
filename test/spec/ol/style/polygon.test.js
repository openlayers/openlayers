goog.provide('ol.test.style.Polygon');

describe('ol.style.Polygon', function() {

  describe('constructor', function() {

    it('accepts literal values', function() {
      var symbolizer = new ol.style.Polygon({
        fillStyle: '#BADA55',
        strokeWidth: 3
      });
      expect(symbolizer).toBeA(ol.style.Polygon);
    });

    it('accepts expressions', function() {
      var symbolizer = new ol.style.Polygon({
        opacity: new ol.Expression('value / 100'),
        fillStyle: ol.Expression('fillAttr')
      });
      expect(symbolizer).toBeA(ol.style.Polygon);
    });

  });

  describe('#createLiteral()', function() {

    it('evaluates expressions with the given feature', function() {
      var symbolizer = new ol.style.Polygon({
        opacity: new ol.Expression('value / 100'),
        fillStyle: new ol.Expression('fillAttr')
      });

      var feature = new ol.Feature(undefined, {
        value: 42,
        fillAttr: '#ff0000'
      });

      var literal = symbolizer.createLiteral(feature);
      expect(literal).toBeA(ol.style.LiteralPolygon);
      expect(literal.opacity).toBe(42 / 100);
      expect(literal.fillStyle).toBe('#ff0000');
    });

  });

});

goog.require('ol.Expression');
goog.require('ol.Feature');
goog.require('ol.style.Polygon');
goog.require('ol.style.LiteralPolygon');
