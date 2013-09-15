goog.provide('ol.test.source.Vector');


describe('ol.source.Vector', function() {

  describe('constructor', function() {
    it('creates an instance', function() {
      var source = new ol.source.Vector({});
      expect(source).to.be.a(ol.source.Vector);
      expect(source).to.be.a(ol.source.Source);
    });
  });

  describe('#prepareFeatures', function() {
    it('loads and parses data from a file', function(done) {
      var source = new ol.source.Vector({
        url: 'spec/ol/parser/geojson/countries.geojson',
        parser: new ol.parser.GeoJSON()
      });
      var layer = new ol.layer.Vector({
        source: source
      });
      source.prepareFeatures(layer, [-180, -90, 180, 90],
          ol.proj.get('EPSG:4326'),
          function() {
            expect(source.loadState_).to.be(ol.source.VectorLoadState.LOADED);
            expect(goog.object.getCount(
                layer.featureCache_.getFeaturesObject())).to.be(179);
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
      var layer = new ol.layer.Vector({
        source: source
      });
      source.prepareFeatures(layer, [-180, -90, 180, 90],
          ol.proj.get('EPSG:4326'),
          function() {
            expect(source.loadState_).to.be(ol.source.VectorLoadState.LOADED);
            expect(goog.object.getCount(
                layer.featureCache_.getFeaturesObject())).to.be(4);
            done();
          });
    });
  });

});

goog.require('goog.object');
goog.require('ol.layer.Vector');
goog.require('ol.parser.GeoJSON');
goog.require('ol.proj');
goog.require('ol.source.Source');
goog.require('ol.source.Vector');
