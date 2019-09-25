import Tile from '../../../../src/ol/Tile.js';
import TileRange from '../../../../src/ol/TileRange.js';
import {get as getProjection} from '../../../../src/ol/proj.js';
import Projection from '../../../../src/ol/proj/Projection.js';
import Source from '../../../../src/ol/source/Source.js';
import TileSource from '../../../../src/ol/source/Tile.js';
import {getKeyZXY} from '../../../../src/ol/tilecoord.js';
import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';


/**
 * Tile source for tests that uses a EPSG:4326 based grid with 4 resolutions and
 * 256x256 tiles.
 *
 * @param {Object<string, ol.TileState>} tileStates Lookup of tile key to
 *     tile state.
 */
class MockTile extends TileSource {
  constructor(tileStates) {
    const tileGrid = new TileGrid({
      resolutions: [360 / 256, 180 / 256, 90 / 256, 45 / 256],
      origin: [-180, -180],
      tileSize: 256
    });

    super({
      projection: getProjection('EPSG:4326'),
      tileGrid: tileGrid
    });

    for (const key in tileStates) {
      this.tileCache.set(key, new Tile(key.split('/'), tileStates[key]));
    }
  }
}


/**
 * @inheritDoc
 */
MockTile.prototype.getTile = function(z, x, y) {
  const key = getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(key)) {
    return /** @type {!ol.Tile} */ (this.tileCache.get(key));
  } else {
    const tile = new Tile(key, 0); // IDLE
    this.tileCache.set(key, tile);
    return tile;
  }
};

describe('ol.source.Tile', () => {

  describe('constructor', () => {
    test('returns a tile source', () => {
      const source = new TileSource({
        projection: getProjection('EPSG:4326')
      });
      expect(source).toBeInstanceOf(Source);
      expect(source).toBeInstanceOf(TileSource);
    });
    test('sets a screen dependent cache size', () => {
      const source = new TileSource({});
      expect(source.tileCache.highWaterMark).toBe(
        4 * Math.ceil(screen.availWidth / 256) * Math.ceil(screen.availHeight / 256)
      );
    });
    test('sets a custom cache size', () => {
      const projection = getProjection('EPSG:4326');
      const source = new TileSource({
        projection: projection,
        cacheSize: 42
      });
      expect(source.getTileCacheForProjection(projection).highWaterMark).toBe(42);
    });
  });

  describe('#setKey()', () => {
    test('sets the source key', () => {
      const source = new TileSource({});
      expect(source.getKey()).toBe('');

      const key = 'foo';
      source.setKey(key);
      expect(source.getKey()).toBe(key);
    });
  });

  describe('#setKey()', () => {
    test('dispatches a change event', done => {
      const source = new TileSource({});

      const key = 'foo';
      source.once('change', function() {
        done();
      });
      source.setKey(key);
    });

    test('does not dispatch change if key does not change', done => {
      const source = new TileSource({});

      const key = 'foo';
      source.once('change', function() {
        source.once('change', function() {
          done(new Error('Unexpected change event after source.setKey()'));
        });
        setTimeout(function() {
          done();
        }, 10);
        source.setKey(key); // this should not result in a change event
      });

      source.setKey(key); // this should result in a change event
    });

  });

  describe('#forEachLoadedTile()', () => {

    let callback;
    beforeEach(() => {
      callback = sinon.spy();
    });

    test('does not call the callback if no tiles are loaded', () => {
      const source = new MockTile({});
      const grid = source.getTileGrid();
      const extent = [-180, -180, 180, 180];
      const zoom = 3;
      const range = grid.getTileRangeForExtentAndZ(extent, zoom);

      source.forEachLoadedTile(source.getProjection(), zoom, range, callback);
      expect(callback.callCount).toBe(0);
    });

    test('does not call getTile() if no tiles are loaded', () => {
      const source = new MockTile({});
      sinon.spy(source, 'getTile');
      const grid = source.getTileGrid();
      const extent = [-180, -180, 180, 180];
      const zoom = 3;
      const range = grid.getTileRangeForExtentAndZ(extent, zoom);

      source.forEachLoadedTile(source.getProjection(), zoom, range, callback);
      expect(source.getTile.callCount).toBe(0);
      source.getTile.restore();
    });


    test('calls callback for each loaded tile', () => {
      const source = new MockTile({
        '1/0/0': 2, // LOADED
        '1/0/1': 2, // LOADED
        '1/1/0': 1, // LOADING,
        '1/1/1': 2 // LOADED
      });

      const zoom = 1;
      const range = new TileRange(0, 1, 0, 1);

      source.forEachLoadedTile(source.getProjection(), zoom, range, callback);
      expect(callback.callCount).toBe(3);
    });

    test('returns true if range is fully loaded', () => {
      // a source with no loaded tiles
      const source = new MockTile({
        '1/0/0': 2, // LOADED,
        '1/0/1': 2, // LOADED,
        '1/1/0': 2, // LOADED,
        '1/1/1': 2 // LOADED
      });

      const zoom = 1;
      const range = new TileRange(0, 1, 0, 1);

      const covered = source.forEachLoadedTile(
        source.getProjection(), zoom, range,
        function() {
          return true;
        });
      expect(covered).toBe(true);
    });

    test('returns false if range is not fully loaded', () => {
      // a source with no loaded tiles
      const source = new MockTile({
        '1/0/0': 2, // LOADED,
        '1/0/1': 2, // LOADED,
        '1/1/0': 1, // LOADING,
        '1/1/1': 2 // LOADED
      });

      const zoom = 1;
      const range = new TileRange(0, 1, 0, 1);

      const covered = source.forEachLoadedTile(
        source.getProjection(), zoom,
        range, function() {
          return true;
        });
      expect(covered).toBe(false);
    });

    test('allows callback to override loaded check', () => {
      // a source with no loaded tiles
      const source = new MockTile({
        '1/0/0': 2, // LOADED,
        '1/0/1': 2, // LOADED,
        '1/1/0': 2, // LOADED,
        '1/1/1': 2 // LOADED
      });

      const zoom = 1;
      const range = new TileRange(0, 1, 0, 1);

      const covered = source.forEachLoadedTile(
        source.getProjection(), zoom, range,
        function() {
          return false;
        });
      expect(covered).toBe(false);
    });

  });

  describe('#getTileCoordForTileUrlFunction()', () => {

    test('returns the expected tile coordinate - {wrapX: true}', () => {
      const tileSource = new TileSource({
        projection: 'EPSG:3857',
        wrapX: true
      });

      let tileCoord = tileSource.getTileCoordForTileUrlFunction([6, -31, 22]);
      expect(tileCoord).toEqual([6, 33, 22]);

      tileCoord = tileSource.getTileCoordForTileUrlFunction([6, 33, 22]);
      expect(tileCoord).toEqual([6, 33, 22]);

      tileCoord = tileSource.getTileCoordForTileUrlFunction([6, 97, 22]);
      expect(tileCoord).toEqual([6, 33, 22]);
    });

    test('returns the expected tile coordinate - {wrapX: false}', () => {
      const tileSource = new TileSource({
        projection: 'EPSG:3857',
        wrapX: false
      });

      let tileCoord = tileSource.getTileCoordForTileUrlFunction([6, -31, 22]);
      expect(tileCoord).toEqual(null);

      tileCoord = tileSource.getTileCoordForTileUrlFunction([6, 33, 22]);
      expect(tileCoord).toEqual([6, 33, 22]);

      tileCoord = tileSource.getTileCoordForTileUrlFunction([6, 97, 22]);
      expect(tileCoord).toEqual(null);
    });

    test('works with wrapX and custom projection without extent', () => {
      const tileSource = new TileSource({
        projection: new Projection({
          code: 'foo',
          global: true,
          units: 'm'
        }),
        wrapX: true
      });

      const tileCoord = tileSource.getTileCoordForTileUrlFunction([6, -31, 22]);
      expect(tileCoord).toEqual([6, 33, 22]);
    });
  });

  describe('#refresh()', () => {
    test('checks clearing of internal state', () => {
      // create a source with one loaded tile
      const source = new MockTile({
        '1/0/0': 2 // LOADED
      });
      // check the loaded tile is there
      const tile = source.getTile(1, 0, 0);
      expect(tile).toBeInstanceOf(Tile);
      expect(source.tileCache.getCount()).toEqual(1);
      // refresh the source
      source.refresh();
      expect(source.tileCache.getCount()).toEqual(0);
    });
  });

});


describe('MockTile', () => {

  describe('constructor', () => {
    test('creates a tile source', () => {
      const source = new MockTile({});
      expect(source).toBeInstanceOf(TileSource);
      expect(source).toBeInstanceOf(MockTile);
    });
  });

  describe('#getTile()', () => {
    test('returns a tile with state based on constructor arg', () => {
      const source = new MockTile({
        '0/0/0': 2, // LOADED,
        '1/0/0': 2 // LOADED
      });
      let tile;

      // check a loaded tile
      tile = source.getTile(0, 0, 0);
      expect(tile).toBeInstanceOf(Tile);
      expect(tile.state).toBe(2);

      // check a tile that is not loaded
      tile = source.getTile(1, 0, -1);
      expect(tile).toBeInstanceOf(Tile);
      expect(tile.state).toBe(0);

      // check another loaded tile
      tile = source.getTile(1, 0, 0);
      expect(tile).toBeInstanceOf(Tile);
      expect(tile.state).toBe(2);

    });
  });

});
