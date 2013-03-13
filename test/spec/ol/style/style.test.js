goog.provide('ol.test.style.Style');

describe('ol.style.Style', function() {

  describe('#apply()', function() {

    it('applies a style to a feature', function() {

      var style = new ol.style.Style({
        rules: [
          new ol.style.Rule({
            filter: new ol.filter.Filter(function(feature) {
              return feature.get('foo') == 'bar';
            }),
            symbolizers: [
              new ol.style.Shape({
                size: 4,
                fillColor: '#BADA55'
              })
            ]
          })
        ]
      });
      var feature = new ol.Feature();
      feature.set('foo', 'bar');
      expect(style.apply(feature).length).toBe(1);
      expect(style.apply(feature)[0].fillColor).toBe('#BADA55');
      feature.set('foo', 'baz');
      expect(style.apply(feature).length).toBe(0);
    });

  });

  describe('ol.style.Style.applyDefaultStyle()', function() {
    var feature = new ol.Feature();

    it('returns an empty array for features without geometry', function() {
      expect(ol.style.Style.applyDefaultStyle(feature).length).toBe(0);
    });

    it('returns an array with the Shape default for points', function() {
      feature.setGeometry(new ol.geom.Point([0, 0]));
      var symbolizers = ol.style.Style.applyDefaultStyle(feature);
      expect(symbolizers.length).toBe(1);
      expect(symbolizers[0]).toBeA(ol.style.ShapeLiteral);
      expect(symbolizers[0].equals(ol.style.ShapeDefaults)).toBe(true);
    });

    it('returns an array with the Line default for lines', function() {
      feature.setGeometry(new ol.geom.LineString([[0, 0], [1, 1]]));
      expect(ol.style.Style.applyDefaultStyle(feature)[0]
          .equals(ol.style.LineDefaults)).toBe(true);
    });

    it('returns an array with the Polygon default for polygons', function() {
      feature.setGeometry(new ol.geom.Polygon([[[0, 0], [1, 1], [0, 0]]]));
      expect(ol.style.Style.applyDefaultStyle(feature)[0]
          .equals(ol.style.PolygonDefaults)).toBe(true);
    });

  });

});

goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.filter.Filter');
goog.require('ol.style.Rule');
goog.require('ol.style.Shape');
goog.require('ol.style.ShapeLiteral');
goog.require('ol.style.Style');
