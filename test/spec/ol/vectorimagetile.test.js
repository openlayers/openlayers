

goog.require('ol.TileState');
goog.require('ol.VectorImageTile');
goog.require('ol.VectorTile');
goog.require('ol.events');
goog.require('ol.format.GeoJSON');
goog.require('ol.proj');
goog.require('ol.tilegrid');
goog.require('ol.tilegrid.TileGrid');


describe('ol.VectorImageTile', function() {

  it('configures loader that sets features on the source tile', function(done) {
    var format = new ol.format.GeoJSON();
    var url = 'spec/ol/data/point.json';
    var tile = new ol.VectorImageTile([0, 0, -1], 0, url, format,
        ol.VectorImageTile.defaultLoadFunction, [0, 0, -1], function() {
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

  it('sets LOADED state when previously failed source tiles are loaded', function(done) {
    var format = new ol.format.GeoJSON();
    var url = 'spec/ol/data/unavailable.json';
    var sourceTile;
    var tile = new ol.VectorImageTile([0, 0, 0] /* one world away */, 0, url, format,
        function(tile, url) {
          sourceTile = tile;
          ol.VectorImageTile.defaultLoadFunction(tile, url);
        }, [0, 0, -1], function() {
          return url;
        }, ol.tilegrid.createXYZ(), ol.tilegrid.createXYZ(), {},
        1, ol.proj.get('EPSG:3857'), ol.VectorTile, function() {});

    tile.load();
    var calls = 0;
    ol.events.listen(tile, 'change', function(e) {
      ++calls;
      expect(tile.getState()).to.be(calls == 2 ? ol.TileState.LOADED : ol.TileState.ERROR);
      if (calls == 2) {
        done();
      } else {
        setTimeout(function() {
          sourceTile.setState(ol.TileState.LOADED);
        }, 0);
      }
    });
  });

  it('sets ERROR state when source tiles fail to load', function(done) {
    var format = new ol.format.GeoJSON();
    var url = 'spec/ol/data/unavailable.json';
    var tile = new ol.VectorImageTile([0, 0, -1], 0, url, format,
        ol.VectorImageTile.defaultLoadFunction, [0, 0, -1], function() {
          return url;
        }, ol.tilegrid.createXYZ(), ol.tilegrid.createXYZ(), {},
        1, ol.proj.get('EPSG:3857'), ol.VectorTile, function() {});

    tile.load();

    ol.events.listen(tile, 'change', function(e) {
      expect(tile.getState()).to.be(ol.TileState.ERROR);
      done();
    });
  });

  it('sets EMPTY state when tile has only empty source tiles', function(done) {
    var format = new ol.format.GeoJSON();
    var url = '';
    var tile = new ol.VectorImageTile([0, 0, -1], 0, url, format,
        ol.VectorImageTile.defaultLoadFunction, [0, 0, -1], function() {},
        ol.tilegrid.createXYZ(), ol.tilegrid.createXYZ(), {},
        1, ol.proj.get('EPSG:3857'), ol.VectorTile, function() {});

    tile.load();

    ol.events.listen(tile, 'change', function() {
      expect(tile.getState()).to.be(ol.TileState.EMPTY);
      done();
    });
  });

  it('only loads tiles within the source tileGrid\'s extent', function() {
    var format = new ol.format.GeoJSON();
    var url = 'spec/ol/data/point.json';
    var tileGrid = new ol.tilegrid.TileGrid({
      resolutions: [0.02197265625, 0.010986328125, 0.0054931640625],
      origin: [-180, 90],
      extent: [-88, 35, -87, 36]
    });
    var sourceTiles = {};
    var tile = new ol.VectorImageTile([1, 0, -1], 0, url, format,
        ol.VectorImageTile.defaultLoadFunction, [1, 0, -1], function(zxy) {
          return url;
        }, tileGrid,
        ol.tilegrid.createXYZ({extent: [-180, -90, 180, 90], tileSize: 512}),
        sourceTiles, 1, ol.proj.get('EPSG:4326'), ol.VectorTile, function() {});
    tile.load();
    expect(tile.tileKeys.length).to.be(1);
    expect(tile.getTile(tile.tileKeys[0]).tileCoord).to.eql([0, 16, -10]);
  });

  it('#dispose() while loading', function() {
    var format = new ol.format.GeoJSON();
    var url = 'spec/ol/data/point.json';
    var tile = new ol.VectorImageTile([0, 0, 0] /* one world away */, 0, url, format,
        ol.VectorImageTile.defaultLoadFunction, [0, 0, -1], function() {
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
    var tile = new ol.VectorImageTile([0, 0, -1], 0, url, format,
        ol.VectorImageTile.defaultLoadFunction, [0, 0, -1], function() {
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
