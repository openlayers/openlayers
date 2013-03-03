goog.provide('ol.test.style.Shape');

describe('ol.style.ShapeLiteral', function() {

  describe('#equals()', function() {

    it('identifies equal literals', function() {
      var literal = new ol.style.ShapeLiteral({
        size: 4,
        fillStyle: '#BADA55'
      });
      var equalLiteral = new ol.style.ShapeLiteral({
        fillStyle: '#BADA55',
        size: 4
      });
      var differentLiteral = new ol.style.ShapeLiteral({
        fillStyle: '#013',
        size: 4
      });
      expect(literal.equals(equalLiteral)).toBe(true);
      expect(literal.equals(differentLiteral)).toBe(false);
    });

  });

});

describe('ol.style.Shape', function() {

  describe('constructor', function() {

    it('accepts literal values', function() {
      var symbolizer = new ol.style.Shape({
        size: 4,
        fillStyle: '#BADA55'
      });
      expect(symbolizer).toBeA(ol.style.Shape);
    });

    it('accepts expressions', function() {
      var symbolizer = new ol.style.Shape({
        size: new ol.Expression('sizeAttr'),
        strokeStyle: ol.Expression('color')
      });
      expect(symbolizer).toBeA(ol.style.Shape);
    });

  });

  describe('#createLiteral()', function() {

    it('evaluates expressions with the given feature', function() {
      var symbolizer = new ol.style.Shape({
        size: new ol.Expression('sizeAttr'),
        opacity: new ol.Expression('opacityAttr')
      });

      var feature = new ol.Feature({
        sizeAttr: 42,
        opacityAttr: 0.4
      });

      var literal = symbolizer.createLiteral(feature);
      expect(literal).toBeA(ol.style.ShapeLiteral);
      expect(literal.size).toBe(42);
      expect(literal.opacity).toBe(0.4);
    });

  });

});

goog.require('ol.Expression');
goog.require('ol.Feature');
goog.require('ol.style.Shape');
goog.require('ol.style.ShapeLiteral');
