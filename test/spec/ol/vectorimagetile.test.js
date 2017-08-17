

goog.require('ol.TileState');
goog.require('ol.VectorImageTile');
goog.require('ol.VectorTile');
goog.require('ol.events');
goog.require('ol.format.GeoJSON');
goog.require('ol.proj');
goog.require('ol.tilegrid');


describe('ol.VectorImageTile', function() {

  it('configures loader that sets features on the source tile', function(done) {
    var format = new ol.format.GeoJSON();
    var url = 'spec/ol/data/point.json';
    var tile = new ol.VectorImageTile([0, 0, 0], 0, url, format,
        ol.VectorImageTile.defaultLoadFunction, [0, 0, 0], function() {
          return url;
        }, ol.tilegrid.createXYZ(), ol.tilegrid.createXYZ(), {},
        1, ol.proj.get('EPSG:3857'), ol.VectorTile, function() {});

    tile.load();
    var sourceTile = tile.getTile(tile.tileKeys[0]);
    var loader = sourceTile.loader_;
    expect(typeof loader).to.be('function');

    ol.events.listen(sourceTile, 'change', function(e) {
      expect(sourceTile.getFeatures().length).to.be.greaterThan(0);
      done();
    });
  });

  it('sets LOADED state when source tiles fail to load', function(done) {
    var format = new ol.format.GeoJSON();
    var url = 'spec/ol/data/unavailable.json';
    var tile = new ol.VectorImageTile([0, 0, 0], 0, url, format,
        ol.VectorImageTile.defaultLoadFunction, [0, 0, 0], function() {
          return url;
        }, ol.tilegrid.createXYZ(), ol.tilegrid.createXYZ(), {},
        1, ol.proj.get('EPSG:3857'), ol.VectorTile, function() {});

    tile.load();

    ol.events.listen(tile, 'change', function(e) {
      expect(tile.getState()).to.be(ol.TileState.EMPTY);
      done();
    });
  });

  it('sets LOADED state when previously failed source tiles are loaded', function(done) {
    var format = new ol.format.GeoJSON();
    var url = 'spec/ol/data/unavailable.json';
    var sourceTile;
    var tile = new ol.VectorImageTile([0, 0, 0], 0, url, format,
        function(tile, url) {
          sourceTile = tile;
          ol.VectorImageTile.defaultLoadFunction(tile, url);
        }, [0, 0, 0], function() {
          return url;
        }, ol.tilegrid.createXYZ(), ol.tilegrid.createXYZ(), {},
        1, ol.proj.get('EPSG:3857'), ol.VectorTile, function() {});

    tile.load();
    var calls = 0;
    ol.events.listen(tile, 'change', function(e) {
      ++calls;
      expect(tile.getState()).to.be(calls == 2 ? ol.TileState.LOADED : ol.TileState.EMPTY);
      if (calls == 2) {
        done();
      } else {
        setTimeout(function() {
          sourceTile.setState(ol.TileState.LOADED);
        }, 0);
      }
    });
  });

  it('sets EMPTY state when all source tiles fail to load', function(done) {
    var format = new ol.format.GeoJSON();
    var url = 'spec/ol/data/unavailable.json';
    var tile = new ol.VectorImageTile([0, 0, 0], 0, url, format,
        ol.VectorImageTile.defaultLoadFunction, [0, 0, 0], function() {
          return url;
        }, ol.tilegrid.createXYZ(), ol.tilegrid.createXYZ(), {},
        1, ol.proj.get('EPSG:3857'), ol.VectorTile, function() {});

    tile.load();

    ol.events.listen(tile, 'change', function(e) {
      expect(tile.getState()).to.be(ol.TileState.EMPTY);
      done();
    });
  });

  it('sets EMPTY state when tile has only empty source tiles', function(done) {
    var format = new ol.format.GeoJSON();
    var url = '';
    var tile = new ol.VectorImageTile([0, 0, 0], 0, url, format,
        ol.VectorImageTile.defaultLoadFunction, [0, 0, 0], function() {},
        ol.tilegrid.createXYZ(), ol.tilegrid.createXYZ(), {},
        1, ol.proj.get('EPSG:3857'), ol.VectorTile, function() {});

    tile.load();

    ol.events.listen(tile, 'change', function() {
      expect(tile.getState()).to.be(ol.TileState.EMPTY);
      done();
    });
  });

  it('#dispose() while loading', function() {
    var format = new ol.format.GeoJSON();
    var url = 'spec/ol/data/point.json';
    var tile = new ol.VectorImageTile([0, 0, 0], 0, url, format,
        ol.VectorImageTile.defaultLoadFunction, [0, 0, 0], function() {
          return url;
        }, ol.tilegrid.createXYZ(), ol.tilegrid.createXYZ({tileSize: 512}), {},
        1, ol.proj.get('EPSG:3857'), ol.VectorTile, function() {});

    tile.load();
    expect(tile.loadListenerKeys_.length).to.be(4);
    expect(tile.tileKeys.length).to.be(4);
    expect(tile.getState()).to.be(ol.TileState.LOADING);
    tile.dispose();
    expect(tile.loadListenerKeys_.length).to.be(0);
    expect(tile.tileKeys.length).to.be(0);
    expect(tile.sourceTiles_).to.be(null);
    expect(tile.getState()).to.be(ol.TileState.ABORT);
  });

  it('#dispose() when loaded', function(done) {
    var format = new ol.format.GeoJSON();
    var url = 'spec/ol/data/point.json';
    var tile = new ol.VectorImageTile([0, 0, 0], 0, url, format,
        ol.VectorImageTile.defaultLoadFunction, [0, 0, 0], function() {
          return url;
        }, ol.tilegrid.createXYZ(), ol.tilegrid.createXYZ({tileSize: 512}), {},
        1, ol.proj.get('EPSG:3857'), ol.VectorTile, function() {});

    tile.load();
    ol.events.listenOnce(tile, 'change', function() {
      expect(tile.getState()).to.be(ol.TileState.LOADED);
      expect(tile.loadListenerKeys_.length).to.be(0);
      expect(tile.tileKeys.length).to.be(4);
      tile.dispose();
      expect(tile.tileKeys.length).to.be(0);
      expect(tile.sourceTiles_).to.be(null);
      expect(tile.getState()).to.be(ol.TileState.ABORT);
      done();
    });
  });

});
