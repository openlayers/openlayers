goog.provide('ol.test.style.ShapeLiteral');

describe('ol.style.ShapeLiteral', function() {

  describe('#equals()', function() {

    it('identifies equal literals', function() {
      var literal = new ol.style.ShapeLiteral({
        type: ol.style.ShapeType.CIRCLE,
        size: 4,
        fillColor: '#BADA55',
        fillOpacity: 0.9,
        strokeColor: '#013',
        strokeOpacity: 0.8,
        strokeWidth: 3
      });
      var equalLiteral = new ol.style.ShapeLiteral({
        type: ol.style.ShapeType.CIRCLE,
        size: 4,
        fillColor: '#BADA55',
        fillOpacity: 0.9,
        strokeColor: '#013',
        strokeOpacity: 0.8,
        strokeWidth: 3
      });
      var differentSize = new ol.style.ShapeLiteral({
        type: ol.style.ShapeType.CIRCLE,
        size: 5,
        fillColor: '#BADA55',
        fillOpacity: 0.9,
        strokeColor: '#013',
        strokeOpacity: 0.8,
        strokeWidth: 3
      });
      var differentFillColor = new ol.style.ShapeLiteral({
        type: ol.style.ShapeType.CIRCLE,
        size: 4,
        fillColor: '#ffffff',
        fillOpacity: 0.9,
        strokeColor: '#013',
        strokeOpacity: 0.8,
        strokeWidth: 3
      });
      var differentFillOpacity = new ol.style.ShapeLiteral({
        type: ol.style.ShapeType.CIRCLE,
        size: 4,
        fillColor: '#BADA55',
        fillOpacity: 0.8,
        strokeColor: '#013',
        strokeOpacity: 0.8,
        strokeWidth: 3
      });
      var differentStrokeColor = new ol.style.ShapeLiteral({
        type: ol.style.ShapeType.CIRCLE,
        size: 4,
        fillColor: '#BADA55',
        fillOpacity: 0.9,
        strokeColor: '#ffffff',
        strokeOpacity: 0.8,
        strokeWidth: 3
      });
      var differentStrokeOpacity = new ol.style.ShapeLiteral({
        type: ol.style.ShapeType.CIRCLE,
        size: 4,
        fillColor: '#BADA55',
        fillOpacity: 0.9,
        strokeColor: '#013',
        strokeOpacity: 0.7,
        strokeWidth: 3
      });
      var differentStrokeWidth = new ol.style.ShapeLiteral({
        type: ol.style.ShapeType.CIRCLE,
        size: 4,
        fillColor: '#BADA55',
        fillOpacity: 0.9,
        strokeColor: '#013',
        strokeOpacity: 0.8,
        strokeWidth: 4
      });
      expect(literal.equals(equalLiteral)).to.be(true);
      expect(literal.equals(differentSize)).to.be(false);
      expect(literal.equals(differentFillColor)).to.be(false);
      expect(literal.equals(differentFillOpacity)).to.be(false);
      expect(literal.equals(differentStrokeColor)).to.be(false);
      expect(literal.equals(differentStrokeOpacity)).to.be(false);
      expect(literal.equals(differentStrokeWidth)).to.be(false);
    });

  });

});

goog.require('ol.style.ShapeLiteral');
goog.require('ol.style.ShapeType');
