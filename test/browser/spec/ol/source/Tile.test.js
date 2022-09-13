import Map from '../../../../../src/ol/Map.js';
import Projection from '../../../../../src/ol/proj/Projection.js';
import Source from '../../../../../src/ol/source/Source.js';
import Tile from '../../../../../src/ol/Tile.js';
import TileDebugSource from '../../../../../src/ol/source/TileDebug.js';
import TileGrid from '../../../../../src/ol/tilegrid/TileGrid.js';
import TileLayer from '../../../../../src/ol/layer/Tile.js';
import TileRange from '../../../../../src/ol/TileRange.js';
import TileSource from '../../../../../src/ol/source/Tile.js';
import View from '../../../../../src/ol/View.js';
import {getKeyZXY} from '../../../../../src/ol/tilecoord.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';

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
      tileSize: 256,
    });

    super({
      projection: getProjection('EPSG:4326'),
      tileGrid: tileGrid,
    });

    for (const key in tileStates) {
      this.tileCache.set(key, new Tile(key.split('/'), tileStates[key]));
    }
  }
}

MockTile.prototype.getTile = function (z, x, y) {
  const key = getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(key)) {
    return /** @type {!ol.Tile} */ (this.tileCache.get(key));
  }
  const tile = new Tile(key, 0); // IDLE
  this.tileCache.set(key, tile);
  return tile;
};

describe('ol/source/Tile', function () {
  describe('constructor', function () {
    it('returns a tile source', function () {
      const source = new TileSource({
        projection: getProjection('EPSG:4326'),
      });
      expect(source).to.be.a(Source);
      expect(source).to.be.a(TileSource);
    });
    it('sets 0 as initial cache size', function () {
      const source = new TileSource({});
      expect(source.tileCache.highWaterMark).to.be(0);
    });
    it('grows the cache', function () {
      const source = new TileDebugSource();
      const layer = new TileLayer({
        source: source,
      });
      const target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      const map = new Map({
        layers: [layer],
        view: new View({
          center: [0, 0],
          zoom: 2,
        }),
        target: target,
      });
      map.renderSync();
      expect(
        source.getTileCacheForProjection(map.getView().getProjection())
          .highWaterMark
      ).to.be(4);
      map.setTarget(null);
      document.body.removeChild(target);
    });
    it('sets a custom cache size', function () {
      const projection = getProjection('EPSG:4326');
      const source = new TileSource({
        projection: projection,
        cacheSize: 442,
      });
      expect(source.getTileCacheForProjection(projection).highWaterMark).to.be(
        442
      );
    });
  });

  describe('#setKey()', function () {
    it('sets the source key', function () {
      const source = new TileSource({});
      expect(source.getKey()).to.equal('');

      const key = 'foo';
      source.setKey(key);
      expect(source.getKey()).to.equal(key);
    });
  });

  describe('#getInterpolate()', function () {
    it('is false by default', function () {
      const source = new TileSource({});
      expect(source.getInterpolate()).to.be(false);
    });

    it('is true if constructed with interpolate: true', function () {
      const source = new TileSource({interpolate: true});
      expect(source.getInterpolate()).to.be(true);
    });
  });

  describe('#setKey()', function () {
    it('dispatches a change event', function (done) {
      const source = new TileSource({});

      const key = 'foo';
      source.once('change', function () {
        done();
      });
      source.setKey(key);
    });

    it('does not dispatch change if key does not change', function (done) {
      const source = new TileSource({});

      const key = 'foo';
      source.once('change', function () {
        source.once('change', function () {
          done(new Error('Unexpected change event after source.setKey()'));
        });
        setTimeout(function () {
          done();
        }, 10);
        source.setKey(key); // this should not result in a change event
      });

      source.setKey(key); // this should result in a change event
    });
  });

  describe('#forEachLoadedTile()', function () {
    let callback;
    beforeEach(function () {
      callback = sinon.spy();
    });

    it('does not call the callback if no tiles are loaded', function () {
      const source = new MockTile({});
      const grid = source.getTileGrid();
      const extent = [-180, -180, 180, 180];
      const zoom = 3;
      const range = grid.getTileRangeForExtentAndZ(extent, zoom);

      source.forEachLoadedTile(source.getProjection(), zoom, range, callback);
      expect(callback.callCount).to.be(0);
    });

    it('does not call getTile() if no tiles are loaded', function () {
      const source = new MockTile({});
      sinon.spy(source, 'getTile');
      const grid = source.getTileGrid();
      const extent = [-180, -180, 180, 180];
      const zoom = 3;
      const range = grid.getTileRangeForExtentAndZ(extent, zoom);

      source.forEachLoadedTile(source.getProjection(), zoom, range, callback);
      expect(source.getTile.callCount).to.be(0);
      source.getTile.restore();
    });

    it('calls callback for each loaded tile', function () {
      const source = new MockTile({
        '1/0/0': 2, // LOADED
        '1/0/1': 2, // LOADED
        '1/1/0': 1, // LOADING,
        '1/1/1': 2, // LOADED
      });

      const zoom = 1;
      const range = new TileRange(0, 1, 0, 1);

      source.forEachLoadedTile(source.getProjection(), zoom, range, callback);
      expect(callback.callCount).to.be(3);
    });

    it('returns true if range is fully loaded', function () {
      // a source with no loaded tiles
      const source = new MockTile({
        '1/0/0': 2, // LOADED,
        '1/0/1': 2, // LOADED,
        '1/1/0': 2, // LOADED,
        '1/1/1': 2, // LOADED
      });

      const zoom = 1;
      const range = new TileRange(0, 1, 0, 1);

      const covered = source.forEachLoadedTile(
        source.getProjection(),
        zoom,
        range,
        function () {
          return true;
        }
      );
      expect(covered).to.be(true);
    });

    it('returns false if range is not fully loaded', function () {
      // a source with no loaded tiles
      const source = new MockTile({
        '1/0/0': 2, // LOADED,
        '1/0/1': 2, // LOADED,
        '1/1/0': 1, // LOADING,
        '1/1/1': 2, // LOADED
      });

      const zoom = 1;
      const range = new TileRange(0, 1, 0, 1);

      const covered = source.forEachLoadedTile(
        source.getProjection(),
        zoom,
        range,
        function () {
          return true;
        }
      );
      expect(covered).to.be(false);
    });

    it('allows callback to override loaded check', function () {
      // a source with no loaded tiles
      const source = new MockTile({
        '1/0/0': 2, // LOADED,
        '1/0/1': 2, // LOADED,
        '1/1/0': 2, // LOADED,
        '1/1/1': 2, // LOADED
      });

      const zoom = 1;
      const range = new TileRange(0, 1, 0, 1);

      const covered = source.forEachLoadedTile(
        source.getProjection(),
        zoom,
        range,
        function () {
          return false;
        }
      );
      expect(covered).to.be(false);
    });
  });

  describe('#getTileCoordForTileUrlFunction()', function () {
    it('returns the expected tile coordinate - {wrapX: true}', function () {
      const tileSource = new TileSource({
        projection: 'EPSG:3857',
        wrapX: true,
      });

      let tileCoord = tileSource.getTileCoordForTileUrlFunction([6, -31, 22]);
      expect(tileCoord).to.eql([6, 33, 22]);

      tileCoord = tileSource.getTileCoordForTileUrlFunction([6, 33, 22]);
      expect(tileCoord).to.eql([6, 33, 22]);

      tileCoord = tileSource.getTileCoordForTileUrlFunction([6, 97, 22]);
      expect(tileCoord).to.eql([6, 33, 22]);
    });

    it('returns the expected tile coordinate - {wrapX: false}', function () {
      const tileSource = new TileSource({
        projection: 'EPSG:3857',
        wrapX: false,
      });

      let tileCoord = tileSource.getTileCoordForTileUrlFunction([6, -31, 22]);
      expect(tileCoord).to.eql(null);

      tileCoord = tileSource.getTileCoordForTileUrlFunction([6, 33, 22]);
      expect(tileCoord).to.eql([6, 33, 22]);

      tileCoord = tileSource.getTileCoordForTileUrlFunction([6, 97, 22]);
      expect(tileCoord).to.eql(null);
    });

    it('works with wrapX and custom projection without extent', function () {
      const tileSource = new TileSource({
        projection: new Projection({
          code: 'foo',
          global: true,
          units: 'm',
        }),
        wrapX: true,
      });

      const tileCoord = tileSource.getTileCoordForTileUrlFunction([6, -31, 22]);
      expect(tileCoord).to.eql([6, 33, 22]);
    });
  });

  describe('#refresh()', function () {
    it('checks clearing of internal state', function () {
      // create a source with one loaded tile
      const source = new MockTile({
        '1/0/0': 2, // LOADED
      });
      // check the loaded tile is there
      const tile = source.getTile(1, 0, 0);
      expect(tile).to.be.a(Tile);
      // check tile cache is filled
      expect(source.tileCache.getCount()).to.eql(1);
      // refresh the source
      source.refresh();
      // check tile cache after refresh (should be empty)
      expect(source.tileCache.getCount()).to.eql(0);
    });
  });
});

describe('MockTile', function () {
  describe('constructor', function () {
    it('creates a tile source', function () {
      const source = new MockTile({});
      expect(source).to.be.a(TileSource);
      expect(source).to.be.a(MockTile);
    });
  });

  describe('#getTile()', function () {
    it('returns a tile with state based on constructor arg', function () {
      const source = new MockTile({
        '0/0/0': 2, // LOADED,
        '1/0/0': 2, // LOADED
      });
      let tile;

      // check a loaded tile
      tile = source.getTile(0, 0, 0);
      expect(tile).to.be.a(Tile);
      expect(tile.state).to.be(2); // LOADED

      // check a tile that is not loaded
      tile = source.getTile(1, 0, -1);
      expect(tile).to.be.a(Tile);
      expect(tile.state).to.be(0); // IDLE

      // check another loaded tile
      tile = source.getTile(1, 0, 0);
      expect(tile).to.be.a(Tile);
      expect(tile.state).to.be(2); // LOADED
    });
  });
});
