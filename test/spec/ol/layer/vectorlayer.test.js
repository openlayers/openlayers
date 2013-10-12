goog.provide('ol.test.layer.Vector');

describe('ol.layer.Vector', function() {

  describe('#addFeatures()', function() {

    it('allows adding features', function() {
      var layer = new ol.layer.Vector({
        source: new ol.source.Vector({})
      });
      layer.addFeatures([new ol.Feature(), new ol.Feature()]);
      expect(goog.object.getCount(layer.featureCache_.getFeaturesObject()))
          .to.eql(2);
    });
  });

  describe('ol.layer.FeatureCache#getFeaturesObject()', function() {

    var layer, features;

    beforeEach(function() {
      features = [
        new ol.Feature({
          g: new ol.geom.Point([16.0, 48.0])
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[17.0, 49.0], [17.1, 49.1]])
        })
      ];
      layer = new ol.layer.Vector({
        source: new ol.source.Vector({})
      });
      layer.addFeatures(features);
    });

    it('returns the features in an object', function() {
      var featuresObject = layer.featureCache_.getFeaturesObject();
      expect(goog.object.getCount(featuresObject)).to.eql(features.length);
    });

  });

  describe('#groupFeaturesBySymbolizerLiteral()', function() {

    var layer = new ol.layer.Vector({
      source: new ol.source.Vector({
        projection: ol.proj.get('EPSG:4326')
      }),
      style: new ol.style.Style({
        rules: [
          new ol.style.Rule({
            symbolizers: [
              new ol.style.Stroke({
                width: 2,
                color: ol.expr.parse('colorProperty'),
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

      var groups = layer.groupFeaturesBySymbolizerLiteral(features, 1);
      expect(groups.length).to.be(2);
      expect(groups[0][0].length).to.be(1);
      expect(groups[0][1].color).to.be('#BADA55');
      expect(groups[1][0].length).to.be(2);
      expect(groups[1][1].color).to.be('#013');
    });

    it('groups equal symbolizers also when defined on features', function() {
      var symbolizer = new ol.style.Stroke({
        width: 3,
        color: ol.expr.parse('colorProperty'),
        opacity: 1
      });
      var anotherSymbolizer = new ol.style.Stroke({
        width: 3,
        color: '#BADA55',
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

      var groups = layer.groupFeaturesBySymbolizerLiteral(features, 1);
      expect(groups).to.have.length(3);
      expect(groups[2][0].length).to.be(2);
      expect(groups[2][1].width).to.be(3);

    });

    it('sorts groups by zIndex', function() {
      var symbolizer = new ol.style.Stroke({
        width: 3,
        color: '#BADA55',
        opacity: 1,
        zIndex: 1
      });
      var anotherSymbolizer = new ol.style.Stroke({
        width: 3,
        color: '#BADA55',
        opacity: 1
      });
      var featureWithSymbolizers = new ol.Feature({
        g: new ol.geom.LineString([[-10, -10], [-10, 10]])
      });
      featureWithSymbolizers.setSymbolizers([symbolizer]);
      var anotherFeatureWithSymbolizers = new ol.Feature({
        g: new ol.geom.LineString([[-10, 10], [-10, -10]])
      });
      anotherFeatureWithSymbolizers.setSymbolizers([anotherSymbolizer]);
      features = [featureWithSymbolizers, anotherFeatureWithSymbolizers];

      var groups = layer.groupFeaturesBySymbolizerLiteral(features, 1);
      expect(groups).to.have.length(2);
      expect(groups[0][1].zIndex).to.be(0);
      expect(groups[1][1].zIndex).to.be(1);
    });

    goog.dispose(layer);

  });

  describe('ol.layer.VectorEvent', function() {

    var layer, features;

    beforeEach(function() {
      features = [
        new ol.Feature({
          g: new ol.geom.Point([16.0, 48.0])
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[17.0, 49.0], [17.1, 49.1]])
        })
      ];
      layer = new ol.layer.Vector({
        source: new ol.source.Vector({})
      });
      layer.addFeatures(features);
    });

    it('dispatches events on feature change', function(done) {
      layer.on('featurechange', function(evt) {
        expect(evt.features[0]).to.be(features[0]);
        expect(evt.extents[0]).to.eql(features[0].getGeometry().getBounds());
        done();
      });
      features[0].set('foo', 'bar');

    });

  });

});

goog.require('goog.dispose');
goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.expr');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.proj');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Rule');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
