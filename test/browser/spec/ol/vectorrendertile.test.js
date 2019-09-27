import {assert} from 'chai';
import TileState from '../../../../src/ol/TileState.js';
import {listen, unlistenByKey} from '../../../../src/ol/events.js';
import EventType from '../../../../src/ol/events/EventType.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import VectorTileSource, {
  defaultLoadFunction,
} from '../../../../src/ol/source/VectorTile.js';
import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';

describe('ol.VectorRenderTile', function () {
  it('triggers "change" when previously failed source tiles are loaded', function (done) {
    let sourceTile;
    const source = new VectorTileSource({
      format: new GeoJSON(),
      url: 'spec/ol/data/unavailable.json',
      tileLoadFunction: function (tile, url) {
        sourceTile = tile;
        defaultLoadFunction(tile, url);
      },
    });
    const tile = source.getTile(0, 0, 0, 1, source.getProjection());

    tile.load();
    let calls = 0;
    listen(tile, 'change', function (e) {
      ++calls;
      if (calls === 1) {
        assert.strictEqual(tile.getState(), TileState.ERROR);
        setTimeout(function () {
          sourceTile.setState(TileState.LOADED);
        }, 0);
      } else if (calls === 2) {
        assert.strictEqual(tile.getState(), TileState.LOADED);
        done();
      }
    });
  });

  it('sets ERROR state when source tiles fail to load', function (done) {
    const source = new VectorTileSource({
      format: new GeoJSON(),
      url: 'spec/ol/data/unavailable.json',
    });
    const tile = source.getTile(0, 0, 0, 1, source.getProjection());

    tile.load();

    listen(tile, 'change', function (e) {
      assert.strictEqual(tile.getState(), TileState.ERROR);
      done();
    });
  });

  it('sets EMPTY state when tile has only empty source tiles', function () {
    const source = new VectorTileSource({
      format: new GeoJSON(),
      url: '',
    });
    const tile = source.getTile(0, 0, 0, 1, source.getProjection());

    tile.load();
    assert.strictEqual(tile.getState(), TileState.EMPTY);
  });

  it("only loads tiles within the source tileGrid's extent", function (done) {
    let tile;
    const url = 'spec/ol/data/point.json';
    const source = new VectorTileSource({
      projection: 'EPSG:4326',
      format: new GeoJSON(),
      tileGrid: new TileGrid({
        resolutions: [0.02197265625, 0.010986328125, 0.0054931640625],
        origin: [-180, 90],
        extent: [-88, 35, -87, 36],
      }),
      tileUrlFunction: function (zxy) {
        return url;
      },
      url: url,
    });

    tile = source.getTile(0, 0, 0, 1, source.getProjection());
    assert.strictEqual(tile.getState(), TileState.EMPTY);

    tile = source.getTile(0, 16, 9, 1, source.getProjection());
    assert.strictEqual(tile.getState(), TileState.IDLE);
    tile.load();
    const key = listen(tile, EventType.CHANGE, function () {
      if (tile.getState() === TileState.LOADED) {
        unlistenByKey(key);
        const sourceTiles = source.getSourceTiles(
          1,
          source.getProjection(),
          tile,
        );
        assert.strictEqual(sourceTiles.length, 1);
        assert.deepEqual(sourceTiles[0].tileCoord, [0, 16, 9]);
        done();
      }
    });
  });
});
