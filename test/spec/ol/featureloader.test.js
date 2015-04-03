goog.provide('ol.test.featureloader');

describe('ol.featureloader', function() {
  describe('ol.featureloader.xhr', function() {
    var loader;
    var source;

    beforeEach(function() {
      var url = 'spec/ol/data/point.json';
      var format = new ol.format.GeoJSON();

      loader = ol.featureloader.xhr(url, format);
      source = new ol.source.Vector();
    });

    it('adds features to the source', function(done) {
      source.on(ol.source.VectorEventType.ADDFEATURE, function(e) {
        expect(source.getFeatures().length).to.be.greaterThan(0);
        done();
      });
      loader.call(source, [], 1, 'EPSG:3857');
    });

  });
});

goog.require('ol.featureloader');
goog.require('ol.format.GeoJSON');
goog.require('ol.source.Vector');
goog.require('ol.source.VectorEventType');
