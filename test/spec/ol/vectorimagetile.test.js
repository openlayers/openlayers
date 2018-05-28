import TileState from '../../../src/ol/TileState.js';
import VectorImageTile, {defaultLoadFunction} from '../../../src/ol/VectorImageTile.js';
import VectorTile from '../../../src/ol/VectorTile.js';
import {listen, listenOnce} from '../../../src/ol/events.js';
import GeoJSON from '../../../src/ol/format/GeoJSON.js';
import {get as getProjection} from '../../../src/ol/proj.js';
import {createXYZ} from '../../../src/ol/tilegrid.js';
import TileGrid from '../../../src/ol/tilegrid/TileGrid.js';


describe('ol.VectorImageTile', function() {

  it('configures loader that sets features on the source tile', function(done) {
    const format = new GeoJSON();
    const url = 'spec/ol/data/point.json';
    const tile = new VectorImageTile([0, 0, -1], 0, url, format,
      defaultLoadFunction, [0, 0, -1], function() {
        return url;
      }, createXYZ(), createXYZ(), {},
      1, getProjection('EPSG:3857'), VectorTile, function() {}, 0);

    tile.load();
    const sourceTile = tile.getTile(tile.tileKeys[0]);
    const loader = sourceTile.loader_;
    expect(typeof loader).to.be('function');

    listen(sourceTile, 'change', function(e) {
      expect(sourceTile.getFeatures().length).to.be.greaterThan(0);
      done();
    });
  });

  it('sets LOADED state when previously failed source tiles are loaded', function(done) {
    const format = new GeoJSON();
    const url = 'spec/ol/data/unavailable.json';
    let sourceTile;
    const tile = new VectorImageTile([0, 0, 0] /* one world away */, 0, url, format,
      function(tile, url) {
        sourceTile = tile;
        defaultLoadFunction(tile, url);
      }, [0, 0, -1], function() {
        return url;
      }, createXYZ(), createXYZ(), {},
      1, getProjection('EPSG:3857'), VectorTile, function() {}, 0);

    tile.load();
    let calls = 0;
    listen(tile, 'change', function(e) {
      ++calls;
      expect(tile.getState()).to.be(calls == 2 ? TileState.LOADED : TileState.ERROR);
      if (calls == 2) {
        done();
      } else {
        setTimeout(function() {
          sourceTile.setState(TileState.LOADED);
        }, 0);
      }
    });
  });

  it('sets ERROR state when source tiles fail to load', function(done) {
    const format = new GeoJSON();
    const url = 'spec/ol/data/unavailable.json';
    const tile = new VectorImageTile([0, 0, -1], 0, url, format,
      defaultLoadFunction, [0, 0, -1], function() {
        return url;
      }, createXYZ(), createXYZ(), {},
      1, getProjection('EPSG:3857'), VectorTile, function() {}, 0);

    tile.load();

    listen(tile, 'change', function(e) {
      expect(tile.getState()).to.be(TileState.ERROR);
      done();
    });
  });

  it('sets EMPTY state when tile has only empty source tiles', function(done) {
    const format = new GeoJSON();
    const url = '';
    const tile = new VectorImageTile([0, 0, -1], 0, url, format,
      defaultLoadFunction, [0, 0, -1], function() {},
      createXYZ(), createXYZ(), {},
      1, getProjection('EPSG:3857'), VectorTile, function() {}, 0);

    tile.load();

    listen(tile, 'change', function() {
      expect(tile.getState()).to.be(TileState.EMPTY);
      done();
    });
  });

  it('only loads tiles within the source tileGrid\'s extent', function() {
    const format = new GeoJSON();
    const url = 'spec/ol/data/point.json';
    const tileGrid = new TileGrid({
      resolutions: [0.02197265625, 0.010986328125, 0.0054931640625],
      origin: [-180, 90],
      extent: [-88, 35, -87, 36]
    });
    const sourceTiles = {};
    const tile = new VectorImageTile([1, 0, -1], 0, url, format,
      defaultLoadFunction, [1, 0, -1], function(zxy) {
        return url;
      }, tileGrid,
      createXYZ({extent: [-180, -90, 180, 90], tileSize: 512}),
      sourceTiles, 1, getProjection('EPSG:4326'), VectorTile, function() {}, 1);
    tile.load();
    expect(tile.tileKeys.length).to.be(1);
    expect(tile.getTile(tile.tileKeys[0]).tileCoord).to.eql([0, 16, -10]);
  });

  it('#dispose() while loading', function() {
    const format = new GeoJSON();
    const url = 'spec/ol/data/point.json';
    const tile = new VectorImageTile([0, 0, 0] /* one world away */, 0, url, format,
      defaultLoadFunction, [0, 0, -1], function() {
        return url;
      }, createXYZ(), createXYZ({tileSize: 512}), {},
      1, getProjection('EPSG:3857'), VectorTile, function() {}, 0);

    tile.load();
    expect(tile.loadListenerKeys_.length).to.be(4);
    expect(tile.tileKeys.length).to.be(4);
    expect(tile.getState()).to.be(TileState.LOADING);
    tile.dispose();
    expect(tile.loadListenerKeys_.length).to.be(0);
    expect(tile.tileKeys.length).to.be(0);
    expect(tile.sourceTiles_).to.be(null);
    expect(tile.getState()).to.be(TileState.ABORT);
  });

  it('#dispose() when loaded', function(done) {
    const format = new GeoJSON();
    const url = 'spec/ol/data/point.json';
    const tile = new VectorImageTile([0, 0, -1], 0, url, format,
      defaultLoadFunction, [0, 0, -1], function() {
        return url;
      }, createXYZ(), createXYZ({tileSize: 512}), {},
      1, getProjection('EPSG:3857'), VectorTile, function() {}, 0);

    tile.load();
    listenOnce(tile, 'change', function() {
      expect(tile.getState()).to.be(TileState.LOADED);
      expect(tile.loadListenerKeys_.length).to.be(0);
      expect(tile.tileKeys.length).to.be(4);
      tile.dispose();
      expect(tile.tileKeys.length).to.be(0);
      expect(tile.sourceTiles_).to.be(null);
      expect(tile.getState()).to.be(TileState.ABORT);
      done();
    });
  });

});
