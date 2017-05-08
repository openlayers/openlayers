goog.provide('ol.test.VectorImageTile');

goog.require('ol.events');
goog.require('ol.VectorImageTile');
goog.require('ol.VectorTile');
goog.require('ol.format.GeoJSON');
goog.require('ol.proj');


describe('ol.VectorImageTile', function() {

  it('sets the loader function on source tiles', function() {
    var format = new ol.format.GeoJSON();
    var url = 'spec/ol/data/point.json';
    var tile = new ol.VectorImageTile([0, 0, 0], 0, url, format,
        ol.VectorImageTile.defaultLoadFunction,
        [0, 0, 0], function() {}, ol.tilegrid.createXYZ(), ol.tilegrid.createXYZ(), {},
        1, ol.proj.get('EPSG:3857'), ol.VectorTile);

    tile.load();
    var loader = tile.getSourceTiles()[0].loader_;
    expect(typeof loader).to.be('function');
  });

  it('loader sets features on the source tile', function(done) {
    var format = new ol.format.GeoJSON();
    var url = 'spec/ol/data/point.json';
    var tile = new ol.VectorImageTile([0, 0, 0], 0, url, format,
        ol.VectorImageTile.defaultLoadFunction, [0, 0, 0], function() {
          return url;
        }, ol.tilegrid.createXYZ(), ol.tilegrid.createXYZ(), {},
        1, ol.proj.get('EPSG:3857'), ol.VectorTile);

    tile.load();
    var sourceTile = tile.getSourceTiles()[0];

    ol.events.listen(sourceTile, 'change', function(e) {
      expect(sourceTile.getFeatures().length).to.be.greaterThan(0);
      done();
    });
  });

});
