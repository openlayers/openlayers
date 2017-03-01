goog.provide('ol.test.VectorTile');

goog.require('ol.events');
goog.require('ol.VectorTile');
goog.require('ol.Feature');
goog.require('ol.format.GeoJSON');
goog.require('ol.format.TextFeature');
goog.require('ol.proj');


describe('ol.VectorTile.defaultLoadFunction()', function() {

  it('sets the loader function on the tile', function() {
    var format = new ol.format.GeoJSON();
    var tile = new ol.VectorTile([0, 0, 0], null, null, format);
    var url = 'https://example.com/';

    ol.VectorTile.defaultLoadFunction(tile, url);
    var loader = tile.loader_;
    expect(typeof loader).to.be('function');
  });

  it('loader sets features on the tile', function(done) {
    var format = new ol.format.GeoJSON();
    var tile = new ol.VectorTile([0, 0, 0], null, null, format);
    var url = 'spec/ol/data/point.json';

    ol.VectorTile.defaultLoadFunction(tile, url);
    var loader = tile.loader_;

    ol.events.listen(tile, 'change', function(e) {
      expect(tile.getFeatures().length).to.be.greaterThan(0);
      done();
    });
    loader.call(tile, [], 1, ol.proj.get('EPSG:3857'));
  });

  it('loader sets features on the tile and updates proj units', function(done) {
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

    var tile = new ol.VectorTile([0, 0, 0], null, null, format);
    var url = 'spec/ol/data/point.json';

    ol.VectorTile.defaultLoadFunction(tile, url);
    var loader = tile.loader_;
    ol.events.listen(tile, 'change', function(e) {
      expect(tile.getFeatures().length).to.be.greaterThan(0);
      expect(tile.getProjection().getUnits()).to.be('tile-pixels');
      done();
    });
    loader.call(tile, [], 1, ol.proj.get('EPSG:3857'));
  });

});
