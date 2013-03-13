goog.provide('ol.test.style.Shape');

describe('ol.style.ShapeLiteral', function() {

  describe('#equals()', function() {

    it('identifies equal literals', function() {
      var literal = new ol.style.ShapeLiteral({
        type: ol.style.ShapeType.CIRCLE,
        size: 4,
        fillColor: '#BADA55',
        strokeColor: '#013',
        strokeWidth: 3,
        opacity: 1
      });
      var equalLiteral = new ol.style.ShapeLiteral({
        type: ol.style.ShapeType.CIRCLE,
        size: 4,
        fillColor: '#BADA55',
        strokeColor: '#013',
        strokeWidth: 3,
        opacity: 1
      });
      var differentLiteral = new ol.style.ShapeLiteral({
        type: ol.style.ShapeType.CIRCLE,
        size: 4,
        fillColor: '#013',
        strokeColor: '#013',
        strokeWidth: 3,
        opacity: 1
      });
      expect(literal.equals(equalLiteral)).to.be(true);
      expect(literal.equals(differentLiteral)).to.be(false);
    });

  });

});

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
        size: new ol.Expression('sizeAttr'),
        strokeColor: new ol.Expression('color')
      });
      expect(symbolizer).to.be.a(ol.style.Shape);
    });

  });

  describe('#createLiteral()', function() {

    it('evaluates expressions with the given feature', function() {
      var symbolizer = new ol.style.Shape({
        size: new ol.Expression('sizeAttr'),
        opacity: new ol.Expression('opacityAttr'),
        fillColor: '#BADA55'
      });

      var feature = new ol.Feature({
        sizeAttr: 42,
        opacityAttr: 0.4
      });

      var literal = symbolizer.createLiteral(feature);
      expect(literal).to.be.a(ol.style.ShapeLiteral);
      expect(literal.size).to.be(42);
      expect(literal.opacity).to.be(0.4);
    });

    it('can be called without a feature', function() {
      var symbolizer = new ol.style.Shape({
        size: 10,
        opacity: 1,
        fillColor: '#BADA55',
        strokeColor: '#013',
        strokeWidth: 2
      });

      var literal = symbolizer.createLiteral();
      expect(literal).to.be.a(ol.style.ShapeLiteral);
      expect(literal.size).to.be(10);
      expect(literal.opacity).to.be(1);
      expect(literal.fillColor).to.be('#BADA55');
      expect(literal.strokeColor).to.be('#013');
      expect(literal.strokeWidth).to.be(2);
    });

    it('applies default type if none provided', function() {
      var symbolizer = new ol.style.Shape({
        size: new ol.Expression('sizeAttr'),
        opacity: new ol.Expression('opacityAttr'),
        fillColor: '#BADA55'
      });

      var feature = new ol.Feature({
        sizeAttr: 42,
        opacityAttr: 0.4
      });

      var literal = symbolizer.createLiteral(feature);
      expect(literal).to.be.a(ol.style.ShapeLiteral);
      expect(literal.size).to.be(42);
      expect(literal.opacity).to.be(0.4);
    });

  });

});

goog.require('ol.Expression');
goog.require('ol.Feature');
goog.require('ol.style.Shape');
goog.require('ol.style.ShapeLiteral');
goog.require('ol.style.ShapeType');
