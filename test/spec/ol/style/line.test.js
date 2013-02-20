goog.provide('ol.test.style.Line');

describe('ol.style.Line', function() {

  describe('constructor', function() {

    it('accepts literal values', function() {
      var symbolizer = new ol.style.Line({
        strokeStyle: '#BADA55',
        strokeWidth: 3
      });
      expect(symbolizer).toBeA(ol.style.Line);
    });

    it('accepts expressions', function() {
      var symbolizer = new ol.style.Line({
        opacity: new ol.Expression('value / 100'),
        strokeWidth: ol.Expression('widthAttr')
      });
      expect(symbolizer).toBeA(ol.style.Line);
    });

  });

  describe('#createLiteral()', function() {

    it('evaluates expressions with the given feature', function() {
      var symbolizer = new ol.style.Line({
        opacity: new ol.Expression('value / 100'),
        strokeWidth: ol.Expression('widthAttr')
      });

      var feature = new ol.Feature(undefined, {
        value: 42,
        widthAttr: 1.5
      });

      var literal = symbolizer.createLiteral(feature);
      expect(literal).toBeA(ol.style.LineLiteral);
      expect(literal.opacity).toBe(42 / 100);
      expect(literal.strokeWidth).toBe(1.5);
    });

  });

});

goog.require('ol.Expression');
goog.require('ol.Feature');
goog.require('ol.style.Line');
goog.require('ol.style.LineLiteral');
