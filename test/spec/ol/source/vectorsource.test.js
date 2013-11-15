goog.provide('ol.test.source.Vector');


describe('ol.source.Vector', function() {

  describe('constructor', function() {
    it('creates an instance', function() {
      var source = new ol.source.Vector();
      expect(source).to.be.a(ol.source.Vector);
      expect(source).to.be.a(ol.source.Source);
    });
  });

  describe('#addFeatures()', function() {

    it('allows adding features', function() {
      var source = new ol.source.Vector();
      source.addFeatures([new ol.Feature(), new ol.Feature()]);
      expect(goog.object.getCount(source.featureCache_.getFeaturesObject()))
          .to.eql(2);
    });
  });

  describe('#prepareFeatures_', function() {
    it('loads and parses data from a file', function(done) {
      var source = new ol.source.Vector({
        url: 'spec/ol/parser/geojson/countries.geojson',
        parser: new ol.parser.GeoJSON()
      });
      source.prepareFeatures_([-180, -90, 180, 90],
          ol.proj.get('EPSG:4326'),
          function() {
            expect(source.loadState_).to.be(ol.source.VectorLoadState.LOADED);
            expect(goog.object.getCount(
                source.featureCache_.getFeaturesObject())).to.be(179);
            done();
          });
    });

    it('parses inline data', function() {
      var source = new ol.source.Vector({
        data: {
          'type': 'FeatureCollection',
          'features': [{
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [0, -6000000]
            }
          }, {
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [-6000000, 0]
            }
          }, {
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [0, 6000000]
            }
          }, {
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [6000000, 0]
            }
          }]
        },
        parser: new ol.parser.GeoJSON(),
        projection: ol.proj.get('EPSG:4326')
      });
      source.prepareFeatures_([-180, -90, 180, 90],
          ol.proj.get('EPSG:4326'),
          function() {
            expect(source.loadState_).to.be(ol.source.VectorLoadState.LOADED);
            expect(goog.object.getCount(
                source.featureCache_.getFeaturesObject())).to.be(4);
            done();
          });
    });



  });

  describe('featurechange event', function() {

    var source, features;

    beforeEach(function() {
      features = [
        new ol.Feature({
          g: new ol.geom.Point([16.0, 48.0])
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[17.0, 49.0], [17.1, 49.1]])
        })
      ];
      source = new ol.source.Vector();
      source.addFeatures(features);
    });

    it('is dispatched on attribute changes', function(done) {
      goog.events.listen(source, ol.source.VectorEventType.CHANGE,
          function(evt) {
            var expected = features[0];
            expect(evt.features[0]).to.be(expected);
            expect(evt.extents[0]).to.eql(expected.getGeometry().getBounds());
            done();

          });

      features[0].set('foo', 'bar');
    });

  });

});

describe('ol.source.FeatureCache', function() {

  describe('#getFeaturesObject()', function() {
    var source, features;

    beforeEach(function() {
      features = [
        new ol.Feature({
          g: new ol.geom.Point([16.0, 48.0])
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[17.0, 49.0], [17.1, 49.1]])
        })
      ];
      source = new ol.source.Vector();
      source.addFeatures(features);
    });

    it('returns the features in an object', function() {
      var featuresObject = source.featureCache_.getFeaturesObject();
      expect(goog.object.getCount(featuresObject)).to.eql(features.length);
    });

  });

});

goog.require('goog.dispose');
goog.require('goog.events');
goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.parser.GeoJSON');
goog.require('ol.proj');
goog.require('ol.source.FeatureCache');
goog.require('ol.source.Source');
goog.require('ol.source.Vector');
goog.require('ol.source.VectorEventType');
