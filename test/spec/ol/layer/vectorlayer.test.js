goog.provide('ol.test.layer.Vector');

describe('ol.layer.Vector', function() {

  describe('#groupFeaturesBySymbolizerLiteral()', function() {

    var layer = new ol.layer.Vector({
      source: new ol.source.Vector({
        projection: ol.projection.get('EPSG:4326')
      }),
      style: new ol.style.Style({
        rules: [
          new ol.style.Rule({
            symbolizers: [
              new ol.style.Line({
                strokeWidth: 2,
                strokeColor: new ol.Expression('colorProperty'),
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
      expect(groups.length).to.be(2);
      expect(groups[0][0].length).to.be(1);
      expect(groups[0][1].strokeColor).to.be('#BADA55');
      expect(groups[1][0].length).to.be(2);
      expect(groups[1][1].strokeColor).to.be('#013');
    });

    it('groups equal symbolizers also when defined on features', function() {
      var symbolizer = new ol.style.Line({
        strokeWidth: 3,
        strokeColor: new ol.Expression('colorProperty'),
        opacity: 1
      });
      var anotherSymbolizer = new ol.style.Line({
        strokeWidth: 3,
        strokeColor: '#BADA55',
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
      expect(groups.length).to.be(3);
      expect(groups[2][0].length).to.be(2);
      expect(groups[2][1].strokeWidth).to.be(3);

    });

    layer.dispose();

  });

});

goog.require('ol.Expression');
goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.projection');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Line');
goog.require('ol.style.Rule');
goog.require('ol.style.Style');
