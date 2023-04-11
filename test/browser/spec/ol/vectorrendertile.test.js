import EventType from '../../../../src/ol/events/EventType.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';
import TileState from '../../../../src/ol/TileState.js';
import VectorTileSource, {
  defaultLoadFunction,
} from '../../../../src/ol/source/VectorTile.js';
import {listen, unlistenByKey} from '../../../../src/ol/events.js';

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
        expect(tile.getState()).to.be(TileState.ERROR);
        setTimeout(function () {
          sourceTile.setState(TileState.LOADED);
        }, 0);
      } else if (calls === 2) {
        expect(tile.getState()).to.be(TileState.LOADED);
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
      expect(tile.getState()).to.be(TileState.ERROR);
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
    expect(tile.getState()).to.be(TileState.EMPTY);
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
    expect(tile.getState()).to.be(TileState.EMPTY);

    tile = source.getTile(0, 16, 9, 1, source.getProjection());
    expect(tile.getState()).to.be(TileState.IDLE);
    tile.load();
    const key = listen(tile, EventType.CHANGE, function () {
      if (tile.getState() === TileState.LOADED) {
        unlistenByKey(key);
        const sourceTiles = source.getSourceTiles(
          1,
          source.getProjection(),
          tile
        );
        expect(sourceTiles.length).to.be(1);
        expect(sourceTiles[0].tileCoord).to.eql([0, 16, 9]);
        done();
      }
    });
  });
});
