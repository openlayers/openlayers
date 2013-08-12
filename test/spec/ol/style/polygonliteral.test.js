goog.provide('ol.test.style.PolygonLiteral');

describe('ol.style.PolygonLiteral', function() {

  describe('#equals()', function() {

    it('identifies equal literals', function() {
      var literal = new ol.style.PolygonLiteral({
        strokeWidth: 3,
        strokeColor: '#013',
        strokeOpacity: 0.4,
        fillColor: '#BADA55',
        fillOpacity: 0.3
      });
      var equalLiteral = new ol.style.PolygonLiteral({
        strokeWidth: 3,
        strokeColor: '#013',
        strokeOpacity: 0.4,
        fillColor: '#BADA55',
        fillOpacity: 0.3
      });
      var differentStrokeWidth = new ol.style.PolygonLiteral({
        strokeWidth: 5,
        strokeColor: '#013',
        strokeOpacity: 0.4,
        fillColor: '#BADA55',
        fillOpacity: 0.3
      });
      var differentStrokeColor = new ol.style.PolygonLiteral({
        strokeWidth: 3,
        strokeColor: '#ffff00',
        strokeOpacity: 0.4,
        fillColor: '#BADA55',
        fillOpacity: 0.3
      });
      var differentStrokeOpacity = new ol.style.PolygonLiteral({
        strokeWidth: 3,
        strokeColor: '#013',
        strokeOpacity: 0.41,
        fillColor: '#BADA55',
        fillOpacity: 0.3
      });
      var differentFillColor = new ol.style.PolygonLiteral({
        strokeWidth: 3,
        strokeColor: '#013',
        strokeOpacity: 0.4,
        fillColor: '#00ffff',
        fillOpacity: 0.3
      });
      var differentFillOpacity = new ol.style.PolygonLiteral({
        strokeWidth: 3,
        strokeColor: '#013',
        strokeOpacity: 0.4,
        fillColor: '#BADA55',
        fillOpacity: 0.31
      });
      expect(literal.equals(equalLiteral)).to.be(true);
      expect(literal.equals(differentStrokeWidth)).to.be(false);
      expect(literal.equals(differentStrokeColor)).to.be(false);
      expect(literal.equals(differentStrokeOpacity)).to.be(false);
      expect(literal.equals(differentFillColor)).to.be(false);
      expect(literal.equals(differentFillOpacity)).to.be(false);
    });

  });

});


goog.require('ol.style.PolygonLiteral');
