goog.provide('ol.test.layer.Vector');

describe('ol.layer.Vector', function() {

  describe('#groupFeaturesBySymbolizerLiteral()', function() {

    it('groups equal symbolizers', function() {
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
      var features = [
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

      layer.dispose();
    });

  });

});
