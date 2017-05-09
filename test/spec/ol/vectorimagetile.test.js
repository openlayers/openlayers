goog.provide('ol.test.VectorImageTile');

goog.require('ol.events');
goog.require('ol.VectorImageTile');
goog.require('ol.VectorTile');
goog.require('ol.format.GeoJSON');
goog.require('ol.proj');


describe('ol.VectorImageTile', function() {

  it('configures loader that sets features on the source tile', function(done) {
    var format = new ol.format.GeoJSON();
    var url = 'spec/ol/data/point.json';
    var tile = new ol.VectorImageTile([0, 0, 0], 0, url, format,
        ol.VectorImageTile.defaultLoadFunction, [0, 0, 0], function() {
          return url;
        }, ol.tilegrid.createXYZ(), ol.tilegrid.createXYZ(), {},
        1, ol.proj.get('EPSG:3857'), ol.VectorTile);

    tile.load();
    var sourceTile = tile.getTile(tile.tileKeys[0]);
    var loader = sourceTile.loader_;
    expect(typeof loader).to.be('function');

    ol.events.listen(sourceTile, 'change', function(e) {
      expect(sourceTile.getFeatures().length).to.be.greaterThan(0);
      done();
    });
  });

  it('sets ERROR state when source tiles fail to load', function(done) {
    var format = new ol.format.GeoJSON();
    var url = 'spec/ol/data/unavailable.json';
    var tile = new ol.VectorImageTile([0, 0, 0], 0, url, format,
        ol.VectorImageTile.defaultLoadFunction, [0, 0, 0], function() {
          return url;
        }, ol.tilegrid.createXYZ(), ol.tilegrid.createXYZ(), {},
        1, ol.proj.get('EPSG:3857'), ol.VectorTile);

    tile.load();

    ol.events.listen(tile, 'change', function(e) {
      expect(tile.getState()).to.be(ol.TileState.ERROR);
      done();
    });
  });

  it('sets EMPTY state when tile has only empty source tiles', function(done) {
    var format = new ol.format.GeoJSON();
    var url = '';
    var tile = new ol.VectorImageTile([0, 0, 0], 0, url, format,
        ol.VectorImageTile.defaultLoadFunction, [0, 0, 0], function() {},
        ol.tilegrid.createXYZ(), ol.tilegrid.createXYZ(), {},
        1, ol.proj.get('EPSG:3857'), ol.VectorTile);

    tile.load();

    ol.events.listen(tile, 'change', function(e) {
      expect(tile.getState()).to.be(ol.TileState.EMPTY);
      done();
    });
  });

});
