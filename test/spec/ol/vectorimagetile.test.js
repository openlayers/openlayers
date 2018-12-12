import TileState from '../../../src/ol/TileState.js';
import {defaultLoadFunction} from '../../../src/ol/VectorImageTile.js';
import VectorTileSource from '../../../src/ol/source/VectorTile.js';
import {listen, listenOnce} from '../../../src/ol/events.js';
import GeoJSON from '../../../src/ol/format/GeoJSON.js';
import {createXYZ} from '../../../src/ol/tilegrid.js';
import TileGrid from '../../../src/ol/tilegrid/TileGrid.js';


describe('ol.VectorImageTile', function() {

  it('configures loader that sets features on the source tile', function(done) {
    const source = new VectorTileSource({
      format: new GeoJSON(),
      url: 'spec/ol/data/point.json'
    });
    const tile = source.getTile(0, 0, 0, 1, source.getProjection());

    tile.load();
    const sourceTile = tile.getTile(tile.tileKeys[0]);
    const loader = sourceTile.loader_;
    expect(typeof loader).to.be('function');

    listen(sourceTile, 'change', function(e) {
      expect(sourceTile.getFeatures().length).to.be.greaterThan(0);
      done();
    });
  });

  it('sets sourceTilesLoaded when previously failed source tiles are loaded', function(done) {
    let sourceTile;
    const source = new VectorTileSource({
      format: new GeoJSON(),
      url: 'spec/ol/data/unavailable.json',
      tileLoadFunction: function(tile, url) {
        sourceTile = tile;
        defaultLoadFunction(tile, url);
      }
    });
    const tile = source.getTile(0, 0, 0, 1, source.getProjection());

    tile.load();
    let calls = 0;
    listen(tile, 'change', function(e) {
      ++calls;
      if (calls === 1) {
        expect(tile.sourceTilesLoaded).to.be(false);
      } else if (calls === 2) {
        expect(tile.sourceTilesLoaded).to.be(true);
      }
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
    const source = new VectorTileSource({
      format: new GeoJSON(),
      url: 'spec/ol/data/unavailable.json'
    });
    const tile = source.getTile(0, 0, 0, 1, source.getProjection());

    tile.load();

    listen(tile, 'change', function(e) {
      expect(tile.getState()).to.be(TileState.ERROR);
      done();
    });
  });

  it('sets EMPTY state when tile has only empty source tiles', function(done) {
    const source = new VectorTileSource({
      format: new GeoJSON(),
      url: ''
    });
    const tile = source.getTile(0, 0, 0, 1, source.getProjection());

    tile.load();

    listen(tile, 'change', function() {
      expect(tile.getState()).to.be(TileState.EMPTY);
      done();
    });
  });

  it('only loads tiles within the source tileGrid\'s extent', function() {
    const url = 'spec/ol/data/point.json';
    const source = new VectorTileSource({
      projection: 'EPSG:4326',
      format: new GeoJSON(),
      tileGrid: new TileGrid({
        resolutions: [0.02197265625, 0.010986328125, 0.0054931640625],
        origin: [-180, 90],
        extent: [-88, 35, -87, 36]
      }),
      tileUrlFunction: function(zxy) {
        return url;
      },
      url: url
    });
    const tile = source.getTile(0, 0, 0, 1, source.getProjection());

    tile.load();
    expect(tile.tileKeys.length).to.be(1);
    expect(tile.getTile(tile.tileKeys[0]).tileCoord).to.eql([0, 16, 9]);
  });

  it('#dispose() while loading', function() {
    const source = new VectorTileSource({
      format: new GeoJSON(),
      url: 'spec/ol/data/point.json',
      tileGrid: createXYZ()
    });
    source.getTileGridForProjection = function() {
      return createXYZ({tileSize: 512});
    };
    const tile = source.getTile(0, 0, 0, 1, source.getProjection());

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

  it('#dispose() when source tiles are loaded', function(done) {
    const source = new VectorTileSource({
      format: new GeoJSON(),
      url: 'spec/ol/data/point.json',
      tileGrid: createXYZ()
    });
    source.getTileGridForProjection = function() {
      return createXYZ({tileSize: 512});
    };
    const tile = source.getTile(0, 0, 0, 1, source.getProjection());

    tile.load();
    listenOnce(tile, 'change', function() {
      expect(tile.getState()).to.be(TileState.LOADING);
      expect(tile.sourceTilesLoaded).to.be.ok();
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
