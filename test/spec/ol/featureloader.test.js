goog.provide('ol.test.featureloader');

goog.require('ol.events');
goog.require('ol.VectorTile');
goog.require('ol.Feature');
goog.require('ol.featureloader');
goog.require('ol.format.GeoJSON');
goog.require('ol.format.TextFeature');
goog.require('ol.proj');
goog.require('ol.source.Vector');


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
      source.on('addfeature', function(e) {
        expect(source.getFeatures().length).to.be.greaterThan(0);
        done();
      });
      loader.call(source, [], 1, 'EPSG:3857');
    });

    describe('when called with urlFunction', function() {
      it('adds features to the source', function(done) {
        url = function(extent, resolution, projection) {
          return 'spec/ol/data/point.json';
        };
        loader = ol.featureloader.xhr(url, format);

        source.on('addfeature', function(e) {
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

  describe('ol.featureloader.tile', function() {
    var loader;
    var tile;

    beforeEach(function() {
      tile = new ol.VectorTile([0, 0, 0]);
    });

    it('sets features on the tile', function(done) {
      var url = 'spec/ol/data/point.json';
      var format = new ol.format.GeoJSON();
      loader = ol.featureloader.tile(url, format);
      ol.events.listen(tile, 'change', function(e) {
        expect(tile.getFeatures().length).to.be.greaterThan(0);
        done();
      });
      loader.call(tile, [], 1, ol.proj.get('EPSG:3857'));
    });

    it('sets features on the tile and updates proj units', function(done) {
      // mock format that return a tile-pixels feature
      var format = new ol.format.TextFeature();
      format.readProjection = function(source) {
        return new ol.proj.Projection({
          code: '',
          units: 'tile-pixels'
        });
      };
      format.readFeatures = function(source, options) {
        return [new ol.Feature()];
      };

      var url = 'spec/ol/data/point.json';
      loader = ol.featureloader.tile(url, format);
      ol.events.listen(tile, 'change', function(e) {
        expect(tile.getFeatures().length).to.be.greaterThan(0);
        expect(tile.getProjection().getUnits()).to.be('tile-pixels');
        done();
      });
      loader.call(tile, [], 1, ol.proj.get('EPSG:3857'));
    });

  });

});
