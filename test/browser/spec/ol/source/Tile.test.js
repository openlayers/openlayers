import Projection from '../../../../../src/ol/proj/Projection.js';
import Source from '../../../../../src/ol/source/Source.js';
import Tile from '../../../../../src/ol/Tile.js';
import TileGrid from '../../../../../src/ol/tilegrid/TileGrid.js';
import TileSource from '../../../../../src/ol/source/Tile.js';
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
