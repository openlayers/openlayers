goog.provide('ol.test.layer.Vector');

describe('ol.layer.Vector', function() {

  describe('#groupFeaturesBySymbolizerLiteral()', function() {

    var layer = new ol.layer.Vector({
      source: new ol.source.Vector({
        projection: ol.projection.getFromCode('EPSG:4326')
      }),
      style: new ol.style.Style({
        rules: [
          new ol.style.Rule({
            symbolizers: [
              new ol.style.Line({
                strokeWidth: 2,
                strokeStyle: new ol.Expression('colorProperty'),
                opacity: 1
              })
            ]
          })
        ]
      })
    });
    var features;

    it('groups equal symbolizers', function() {
      features = [
        new ol.Feature({
          g: new ol.geom.LineString([[-10, -10], [10, 10]]),
          colorProperty: '#BADA55'
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[-10, 10], [10, -10]]),
          colorProperty: '#013'
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[10, -10], [-10, -10]]),
          colorProperty: '#013'
        })
      ];

      var groups = layer.groupFeaturesBySymbolizerLiteral(features);
      expect(groups.length).toBe(2);
      expect(groups[0][0].length).toBe(1);
      expect(groups[0][1].strokeStyle).toBe('#BADA55');
      expect(groups[1][0].length).toBe(2);
      expect(groups[1][1].strokeStyle).toBe('#013');
    });

    it('groups equal symbolizers also when defined on features', function() {
      var symbolizer = new ol.style.Line({
        strokeWidth: 3,
        strokeStyle: new ol.Expression('colorProperty'),
        opacity: 1
      });
      var anotherSymbolizer = new ol.style.Line({
        strokeWidth: 3,
        strokeStyle: '#BADA55',
        opacity: 1
      });
      var featureWithSymbolizers = new ol.Feature({
        g: new ol.geom.LineString([[-10, -10], [-10, 10]]),
        colorProperty: '#BADA55'
      });
      featureWithSymbolizers.setSymbolizers([symbolizer]);
      var anotherFeatureWithSymbolizers = new ol.Feature({
        g: new ol.geom.LineString([[-10, 10], [-10, -10]])
      });
      anotherFeatureWithSymbolizers.setSymbolizers([anotherSymbolizer]);
      features.push(featureWithSymbolizers, anotherFeatureWithSymbolizers);

      var groups = layer.groupFeaturesBySymbolizerLiteral(features);
      expect(groups.length).toBe(3);
      expect(groups[2][0].length).toBe(2);
      expect(groups[2][1].strokeWidth).toBe(3);

    });

    layer.dispose();

  });

});
