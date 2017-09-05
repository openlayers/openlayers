

import _ol_TileState_ from '../../../src/ol/tilestate';
import _ol_VectorImageTile_ from '../../../src/ol/vectorimagetile';
import _ol_VectorTile_ from '../../../src/ol/vectortile';
import _ol_events_ from '../../../src/ol/events';
import _ol_format_GeoJSON_ from '../../../src/ol/format/geojson';
import _ol_proj_ from '../../../src/ol/proj';
import _ol_tilegrid_ from '../../../src/ol/tilegrid';
import _ol_tilegrid_TileGrid_ from '../../../src/ol/tilegrid/tilegrid';


describe('ol.VectorImageTile', function() {

  it('configures loader that sets features on the source tile', function(done) {
    var format = new _ol_format_GeoJSON_();
    var url = 'spec/ol/data/point.json';
    var tile = new _ol_VectorImageTile_([0, 0, -1], 0, url, format,
        _ol_VectorImageTile_.defaultLoadFunction, [0, 0, -1], function() {
          return url;
        }, _ol_tilegrid_.createXYZ(), _ol_tilegrid_.createXYZ(), {},
        1, _ol_proj_.get('EPSG:3857'), _ol_VectorTile_, function() {});

    tile.load();
    var sourceTile = tile.getTile(tile.tileKeys[0]);
    var loader = sourceTile.loader_;
    expect(typeof loader).to.be('function');

    _ol_events_.listen(sourceTile, 'change', function(e) {
      expect(sourceTile.getFeatures().length).to.be.greaterThan(0);
      done();
    });
  });

  it('sets LOADED state when source tiles fail to load', function(done) {
    var format = new _ol_format_GeoJSON_();
    var url = 'spec/ol/data/unavailable.json';
    var tile = new _ol_VectorImageTile_([0, 0, -1], 0, url, format,
        _ol_VectorImageTile_.defaultLoadFunction, [0, 0, -1], function() {
          return url;
        }, _ol_tilegrid_.createXYZ(), _ol_tilegrid_.createXYZ(), {},
        1, _ol_proj_.get('EPSG:3857'), _ol_VectorTile_, function() {});

    tile.load();

    _ol_events_.listen(tile, 'change', function(e) {
      expect(tile.getState()).to.be(_ol_TileState_.EMPTY);
      done();
    });
  });

  it('sets LOADED state when previously failed source tiles are loaded', function(done) {
    var format = new _ol_format_GeoJSON_();
    var url = 'spec/ol/data/unavailable.json';
    var sourceTile;
    var tile = new _ol_VectorImageTile_([0, 0, 0] /* one world away */, 0, url, format,
        function(tile, url) {
          sourceTile = tile;
          _ol_VectorImageTile_.defaultLoadFunction(tile, url);
        }, [0, 0, -1], function() {
          return url;
        }, _ol_tilegrid_.createXYZ(), _ol_tilegrid_.createXYZ(), {},
        1, _ol_proj_.get('EPSG:3857'), _ol_VectorTile_, function() {});

    tile.load();
    var calls = 0;
    _ol_events_.listen(tile, 'change', function(e) {
      ++calls;
      expect(tile.getState()).to.be(calls == 2 ? _ol_TileState_.LOADED : _ol_TileState_.EMPTY);
      if (calls == 2) {
        done();
      } else {
        setTimeout(function() {
          sourceTile.setState(_ol_TileState_.LOADED);
        }, 0);
      }
    });
  });

  it('sets EMPTY state when all source tiles fail to load', function(done) {
    var format = new _ol_format_GeoJSON_();
    var url = 'spec/ol/data/unavailable.json';
    var tile = new _ol_VectorImageTile_([0, 0, -1], 0, url, format,
        _ol_VectorImageTile_.defaultLoadFunction, [0, 0, -1], function() {
          return url;
        }, _ol_tilegrid_.createXYZ(), _ol_tilegrid_.createXYZ(), {},
        1, _ol_proj_.get('EPSG:3857'), _ol_VectorTile_, function() {});

    tile.load();

    _ol_events_.listen(tile, 'change', function(e) {
      expect(tile.getState()).to.be(_ol_TileState_.EMPTY);
      done();
    });
  });

  it('sets EMPTY state when tile has only empty source tiles', function(done) {
    var format = new _ol_format_GeoJSON_();
    var url = '';
    var tile = new _ol_VectorImageTile_([0, 0, -1], 0, url, format,
        _ol_VectorImageTile_.defaultLoadFunction, [0, 0, -1], function() {},
        _ol_tilegrid_.createXYZ(), _ol_tilegrid_.createXYZ(), {},
        1, _ol_proj_.get('EPSG:3857'), _ol_VectorTile_, function() {});

    tile.load();

    _ol_events_.listen(tile, 'change', function() {
      expect(tile.getState()).to.be(_ol_TileState_.EMPTY);
      done();
    });
  });

  it('only loads tiles within the source tileGrid\'s extent', function() {
    var format = new _ol_format_GeoJSON_();
    var url = 'spec/ol/data/point.json';
    var tileGrid = new _ol_tilegrid_TileGrid_({
      resolutions: [0.02197265625, 0.010986328125, 0.0054931640625],
      origin: [-180, 90],
      extent: [-88, 35, -87, 36]
    });
    var sourceTiles = {};
    var tile = new _ol_VectorImageTile_([1, 0, -1], 0, url, format,
        _ol_VectorImageTile_.defaultLoadFunction, [1, 0, -1], function(zxy) {
          return url;
        }, tileGrid,
        _ol_tilegrid_.createXYZ({extent: [-180, -90, 180, 90], tileSize: 512}),
        sourceTiles, 1, _ol_proj_.get('EPSG:4326'), _ol_VectorTile_, function() {});
    tile.load();
    expect(tile.tileKeys.length).to.be(1);
    expect(tile.getTile(tile.tileKeys[0]).tileCoord).to.eql([0, 16, -10]);
  });

  it('#dispose() while loading', function() {
    var format = new _ol_format_GeoJSON_();
    var url = 'spec/ol/data/point.json';
    var tile = new _ol_VectorImageTile_([0, 0, 0] /* one world away */, 0, url, format,
        _ol_VectorImageTile_.defaultLoadFunction, [0, 0, -1], function() {
          return url;
        }, _ol_tilegrid_.createXYZ(), _ol_tilegrid_.createXYZ({tileSize: 512}), {},
        1, _ol_proj_.get('EPSG:3857'), _ol_VectorTile_, function() {});

    tile.load();
    expect(tile.loadListenerKeys_.length).to.be(4);
    expect(tile.tileKeys.length).to.be(4);
    expect(tile.getState()).to.be(_ol_TileState_.LOADING);
    tile.dispose();
    expect(tile.loadListenerKeys_.length).to.be(0);
    expect(tile.tileKeys.length).to.be(0);
    expect(tile.sourceTiles_).to.be(null);
    expect(tile.getState()).to.be(_ol_TileState_.ABORT);
  });

  it('#dispose() when loaded', function(done) {
    var format = new _ol_format_GeoJSON_();
    var url = 'spec/ol/data/point.json';
    var tile = new _ol_VectorImageTile_([0, 0, -1], 0, url, format,
        _ol_VectorImageTile_.defaultLoadFunction, [0, 0, -1], function() {
          return url;
        }, _ol_tilegrid_.createXYZ(), _ol_tilegrid_.createXYZ({tileSize: 512}), {},
        1, _ol_proj_.get('EPSG:3857'), _ol_VectorTile_, function() {});

    tile.load();
    _ol_events_.listenOnce(tile, 'change', function() {
      expect(tile.getState()).to.be(_ol_TileState_.LOADED);
      expect(tile.loadListenerKeys_.length).to.be(0);
      expect(tile.tileKeys.length).to.be(4);
      tile.dispose();
      expect(tile.tileKeys.length).to.be(0);
      expect(tile.sourceTiles_).to.be(null);
      expect(tile.getState()).to.be(_ol_TileState_.ABORT);
      done();
    });
  });

});
