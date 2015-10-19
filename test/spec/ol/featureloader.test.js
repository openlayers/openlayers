goog.provide('ol.test.featureloader');

describe('ol.featureloader', function() {
  describe('ol.featureloader.xhr', function() {
    var loader;
    var source;
    var url;
    var format;

    beforeEach(function() {
      url = 'spec/ol/data/point.json';
      format = new ol.format.GeoJSON();

      source = new ol.source.Vector();
    });

    it('adds features to the source', function(done) {
      loader = ol.featureloader.xhr(url, format);
      source.on(ol.source.VectorEventType.ADDFEATURE, function(e) {
        expect(source.getFeatures().length).to.be.greaterThan(0);
        done();
      });
      loader.call(source, [], 1, 'EPSG:3857');
    });

    describe('when called with urlFunction', function() {
      it('adds features to the source', function(done) {
        url = function(extent, resolution, projection) {
          return 'spec/ol/data/point.json';};
        loader = ol.featureloader.xhr(url, format);

        source.on(ol.source.VectorEventType.ADDFEATURE, function(e) {
          expect(source.getFeatures().length).to.be.greaterThan(0);
          done();
        });
        loader.call(source, [], 1, 'EPSG:3857');
      });

      it('sends the correct arguments to the urlFunction', function(done) {
        var extent = [];
        var resolution = 1;
        var projection = 'EPSG:3857';
        url = function(extent_, resolution_, projection_) {
          expect(extent_).to.eql(extent);
          expect(resolution_).to.eql(resolution);
          expect(projection_).to.eql(projection);
          done();
          return 'spec/ol/data/point.json';
        };
        loader = ol.featureloader.xhr(url, format);
        loader.call(source, [], 1, 'EPSG:3857');
      });
    });

  });
});

goog.require('ol.featureloader');
goog.require('ol.format.GeoJSON');
goog.require('ol.source.Vector');
goog.require('ol.source.VectorEventType');
