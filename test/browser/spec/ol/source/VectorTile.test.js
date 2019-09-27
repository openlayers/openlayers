import {assert} from 'chai';
import Map from '../../../../../src/ol/Map.js';
import TileState from '../../../../../src/ol/TileState.js';
import VectorRenderTile from '../../../../../src/ol/VectorRenderTile.js';
import VectorTile from '../../../../../src/ol/VectorTile.js';
import View from '../../../../../src/ol/View.js';
import {listen, unlistenByKey} from '../../../../../src/ol/events.js';
import GeoJSON from '../../../../../src/ol/format/GeoJSON.js';
import MVT from '../../../../../src/ol/format/MVT.js';
import VectorTileLayer from '../../../../../src/ol/layer/VectorTile.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';
import VectorTileSource from '../../../../../src/ol/source/VectorTile.js';
import {createXYZ} from '../../../../../src/ol/tilegrid.js';
import TileGrid from '../../../../../src/ol/tilegrid/TileGrid.js';

describe('ol/source/VectorTile', function () {
  let format, source;
  beforeEach(function () {
    format = new MVT();
    source = new VectorTileSource({
      format: format,
      url: 'spec/ol/data/{z}-{x}-{y}.vector.pbf',
    });
  });

  describe('constructor', function () {
    it('sets the format on the instance', function () {
      assert.equal(source.format_, format);
    });

    it('sets the default zDirection on the instance', function () {
      assert.strictEqual(source.zDirection, 1);
    });

    it('uses ol.VectorTile as default tileClass', function () {
      assert.equal(source.tileClass, VectorTile);
    });

    it('creates a 512 XYZ tilegrid by default', function () {
      const tileGrid = createXYZ({tileSize: 512});
      assert.equal(source.tileGrid.tileSize_, tileGrid.tileSize_);
      assert.equal(source.tileGrid.extent_, tileGrid.extent_);
    });
  });

  describe('#getTile()', function () {
    it('creates a tile with the correct tile class', function () {
      const tile = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      assert.instanceOf(tile, VectorRenderTile);
      assert.deepEqual(tile.getTileCoord(), [0, 0, 0]);
    });

    it('loads source tiles', function (done) {
      const source = new VectorTileSource({
        format: new GeoJSON(),
        url: 'spec/ol/data/point.json',
      });
      const tile = source.getTile(0, 0, 0, 1, source.getProjection());

      tile.load();
      const key = listen(tile, 'change', function (e) {
        if (tile.getState() === TileState.LOADED) {
          const sourceTile = source.getSourceTiles(
            1,
            source.getProjection(),
            tile,
          )[0];
          assert.isAbove(sourceTile.getFeatures().length, 0);
          unlistenByKey(key);
          done();
        }
      });
    });

    describe('tile loading states', () => {
      let tile, originalSetState;

      beforeEach(() => {
        const source = new VectorTileSource({
          format: new GeoJSON(),
          url: '#/{z}-{x}-{y}.png',
        });

        tile = source.getTile(14, 8938, 5680, 1, source.getProjection());
        originalSetState = tile.setState;
      });

      afterEach(() => {
        tile.setState = originalSetState;
      });

      it('transitions states until EMPTY is set', (done) => {
        const states = [];
        tile.setState = function (state) {
          originalSetState.call(this, state);
          states.push([state, tile.getState()]);
          if (state === TileState.ERROR) {
            assert.deepEqual(states, [
              // [requested state, actual state]
              [TileState.LOADING, TileState.LOADING],
              [TileState.EMPTY, TileState.EMPTY],
              [TileState.ERROR, TileState.EMPTY],
            ]);
            done();
          }
        };
        tile.load();
        tile.dispose();
      });
    });

    it('unreferences source tiles that are no longer used', () => {
      const source = new VectorTileSource({
        format: new GeoJSON(),
        url: 'spec/ol/data/point.json',
      });
      const tile = source.getTile(0, 0, 0, 1, source.getProjection());

      tile.load();
      assert.strictEqual(Object.keys(source.sourceTiles_).length, 1);
      assert.deepEqual(source.tileKeysBySourceTileUrl_, {
        'spec/ol/data/point.json': ['spec/ol/data/point.json/0,0,0'],
      });
      tile.dispose();
      assert.strictEqual(Object.keys(source.sourceTiles_).length, 0);
      assert.deepEqual(source.tileKeysBySourceTileUrl_, {});
    });

    it('unreferences source tiles with different source and render tile grids', () => {
      const source = new VectorTileSource({
        format: new GeoJSON(),
        url: 'spec/ol/data/point.json?{z}-{x}-{y}',
      });
      source.tileGrids_['EPSG:3857'] = new TileGrid({
        origin: [12345678, 12345678],
        resolutions: [
          100000, 50000, 25000, 12500, 6250, 3125, 1562.5, 781.25, 390.625,
          195.3125, 97.65625, 48.828125, 24.4140625, 12.20703125, 6.103515625,
          3.0517578125, 1.52587890625, 0.762939453125, 0.3814697265625,
        ],
        tileSize: 678,
      });

      const tiles = [
        source.getTile(14, 8938, 5680, 1, source.getProjection()),
        source.getTile(14, 8939, 5680, 1, source.getProjection()),
      ];
      tiles.forEach((tile) => tile.load());
      assert.strictEqual(Object.keys(source.sourceTiles_).length, 3);
      assert.deepEqual(source.tileKeysBySourceTileUrl_, {
        'spec/ol/data/point.json?13-5988-6377': [
          'spec/ol/data/point.json?{z}-{x}-{y}/14,8938,5680',
        ],
        'spec/ol/data/point.json?13-5989-6377': [
          'spec/ol/data/point.json?{z}-{x}-{y}/14,8938,5680',
          'spec/ol/data/point.json?{z}-{x}-{y}/14,8939,5680',
        ],
        'spec/ol/data/point.json?13-5990-6377': [
          'spec/ol/data/point.json?{z}-{x}-{y}/14,8939,5680',
        ],
      });
      tiles[1].dispose();
      assert.strictEqual(Object.keys(source.sourceTiles_).length, 2);
      assert.deepEqual(source.tileKeysBySourceTileUrl_, {
        'spec/ol/data/point.json?13-5988-6377': [
          'spec/ol/data/point.json?{z}-{x}-{y}/14,8938,5680',
        ],
        'spec/ol/data/point.json?13-5989-6377': [
          'spec/ol/data/point.json?{z}-{x}-{y}/14,8938,5680',
        ],
      });
    });

    it('handles empty tiles', function () {
      const source = new VectorTileSource({
        format: new GeoJSON(),
        url: '',
      });
      const tile = source.getTile(0, 0, 0, 1, source.getProjection());
      assert.strictEqual(tile.getState(), TileState.EMPTY);
    });

    it('creates empty tiles outside the source extent', function () {
      const fullExtent = getProjection('EPSG:3857').getExtent();
      const source = new VectorTileSource({
        extent: [fullExtent[0], fullExtent[1], 0, 0],
      });
      const tile = source.getTile(1, 1, 1, 1, source.getProjection());
      assert.strictEqual(tile.getState(), TileState.EMPTY);
    });

    it('creates empty tiles outside the world extent when wrapX === false', function () {
      const source = new VectorTileSource({
        wrapX: false,
      });
      const tile = source.getTile(0, -1, 0, 1, source.getProjection());
      assert.strictEqual(tile.getState(), TileState.EMPTY);
    });

    it('creates empty tiles when the tileUrlFunction returns undefined', function () {
      const source = new VectorTileSource({
        tileUrlFunction: function (tileCoord) {
          return;
        },
      });
      const tile = source.getTile(1, 1, 1, 1, source.getProjection());
      assert.strictEqual(tile.getState(), TileState.EMPTY);
    });

    it('creates non-empty tiles outside the world extent when wrapX === true', function () {
      const source = new VectorTileSource({
        url: '{z}/{x}/{y}.pbf',
      });
      const tile = source.getTile(0, -1, 0, 1, source.getProjection());
      assert.strictEqual(tile.getState(), TileState.IDLE);
    });

    it('creates non-empty tiles for overzoomed resolutions', function () {
      const source = new VectorTileSource({
        url: '{z}/{x}/{y}.pbf',
        tileLoadFunction: function (tile) {
          tile.setLoader(function () {});
        },
        maxZoom: 16,
      });
      const tile = source.getTile(
        24,
        9119385,
        5820434,
        1,
        source.getProjection(),
      );
      tile.load();
      assert.strictEqual(tile.getState(), TileState.LOADING);
    });

    it('uses the expected source z when reprojecting', function () {
      const sourceTileCoords = [];
      const source = new VectorTileSource({
        projection: 'EPSG:3857',
        tileUrlFunction: function (tileCoord) {
          sourceTileCoords.push(tileCoord.slice());
          return tileCoord.join('/');
        },
        tileLoadFunction: function (tile) {
          tile.setLoader(function () {});
        },
      });
      const projection = getProjection('EPSG:4326');
      const sourceProjection = source.getProjection();
      const z = 4;
      const tileGrid = source.getTileGridForProjection(projection);
      const resolution = tileGrid.getResolution(z);
      const expectedSourceResolution =
        (resolution / sourceProjection.getMetersPerUnit()) *
        projection.getMetersPerUnit();
      const expectedSourceZ = source
        .getTileGrid()
        .getZForResolution(expectedSourceResolution, 1);
      const tileCoord = tileGrid.getTileCoordForCoordAndZ([0, 0], z);

      const tile = source.getTile(z, tileCoord[1], tileCoord[2], 1, projection);

      assert.strictEqual(tile.getState(), TileState.IDLE);
      assert.isAbove(sourceTileCoords.length, 0);
      sourceTileCoords.forEach(function (sourceTileCoord) {
        assert.strictEqual(sourceTileCoord[0], expectedSourceZ);
      });
    });

    it('creates new tile when source key changes', function () {
      source.setKey('key1');
      const tile1 = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      source.setKey('key2');
      const tile2 = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      assert.strictEqual(tile1.key, 'key1');
      assert.strictEqual(tile2.key, 'key2');
    });
  });

  describe('#getTileGridForProjection', function () {
    it("creates a tile grid with the source tile grid's tile size", function () {
      const tileGrid = source.getTileGridForProjection(
        getProjection('EPSG:3857'),
      );
      assert.strictEqual(tileGrid.getTileSize(0), 512);
    });
  });

  describe('Tile load events', function () {
    it('triggers tileloadstart and tileloadend with ol.VectorTile', function (done) {
      const tile = source.getTile(
        14,
        8938,
        5680,
        1,
        getProjection('EPSG:3857'),
      );
      let started = false;
      source.on('tileloadstart', function () {
        started = true;
      });
      source.on('tileloadend', function (e) {
        assert.strictEqual(started, true);
        assert.instanceOf(e.tile, VectorTile);
        assert.strictEqual(e.tile.getFeatures().length, 1327);
        done();
      });
      tile.load();
    });
    it('triggers events and loads source tile properly for wrapX counterpart', function (done) {
      const tile1 = source.getTile(
        14,
        8938,
        5680,
        1,
        getProjection('EPSG:3857'),
      );
      const tile2 = source.getTile(
        14,
        8938 + Math.pow(2, 14),
        5680,
        1,
        getProjection('EPSG:3857'),
      );
      assert.deepEqual(tile2.wrappedTileCoord, [14, 8938, 5680]);
      let loadstart = 0;
      source.on('tileloadstart', function () {
        ++loadstart;
      });
      let loadend = 0;
      source.on('tileloadend', function (e) {
        ++loadend;
      });
      let loaded = 0;
      [tile1, tile2].forEach((tile) => {
        tile.addEventListener('change', (e) => {
          if (e.target.getState() === TileState.LOADED) {
            const sourceTiles = e.target.getSourceTiles();
            assert.strictEqual(sourceTiles.length, 1);
            assert.strictEqual(sourceTiles[0].getState(), TileState.LOADED);
            ++loaded;
            if (loaded === 2) {
              assert.strictEqual(loadstart, 1);
              assert.strictEqual(loadend, 1);
              done();
            }
          }
        });
        tile.load();
      });
    });
  });

  describe('different source and render tile grids', function () {
    let source, map, loaded;

    beforeEach(function () {
      loaded = [];

      function tileUrlFunction(tileCoord) {
        return tileCoord.join('/');
      }

      function tileLoadFunction(tile, src) {
        tile.setLoader(function () {});
        loaded.push(src);
      }

      const extent = [
        665584.2026596286, 7033250.839875697, 667162.0221431496,
        7035280.378636755,
      ];

      source = new VectorTileSource({
        tileGrid: new TileGrid({
          origin: [218128, 6126002],
          resolutions: [
            4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5,
          ],
        }),
        tileUrlFunction: tileUrlFunction,
        tileLoadFunction: tileLoadFunction,
      });

      map = new Map({
        layers: [
          new VectorTileLayer({
            extent: extent,
            source: source,
          }),
        ],
        target: createMapDiv(100, 100),
        view: new View({
          zoom: 11,
          center: [666373.1624999996, 7034265.3572],
        }),
      });
    });

    afterEach(function () {
      disposeMap(map);
    });

    it('loads only required tiles', function (done) {
      map.renderSync();
      setTimeout(function () {
        assert.deepEqual(loaded, ['5/13/-28']);
        done();
      }, 0);
    });
  });

  describe('tile cache and queue', function () {
    let map, urls, source;

    beforeEach(() => {
      map = new Map({
        target: createMapDiv(100, 100),
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });

      urls = [
        'spec/ol/data/14-8938-5680.vector.pbf?num=0&coord={z},{x},{y}',
        'spec/ol/data/14-8938-5680.vector.pbf?num=1&coord={z},{x},{y}',
        'spec/ol/data/14-8938-5680.vector.pbf?num=2&coord={z},{x},{y}',
        'spec/ol/data/14-8938-5680.vector.pbf?num=3&coord={z},{x},{y}',
      ];

      source = new VectorTileSource({
        format: new MVT(),
        url: urls[0],
      });

      map.addLayer(
        new VectorTileLayer({
          source: source,
        }),
      );
    });

    afterEach(() => {
      disposeMap(map);
    });

    it('does not fill up the tile queue', function (done) {
      const tileQueue = map.tileQueue_;
      const max = urls.length + 3;
      let count = 0;
      map.on('rendercomplete', () => {
        ++count;

        assert.strictEqual(tileQueue.getTilesLoading(), 0);
        if (count === max) {
          done();
          return;
        }

        const newUrl = urls[count % urls.length];
        source.setUrl(newUrl);
      });
    });

    it('clears source tiles on refresh()', async () => {
      await new Promise((resolve) => map.once('rendercomplete', resolve));
      assert.isAbove(Object.keys(source.sourceTiles_).length, 0);
      source.refresh();
      map.renderSync();
      assert.strictEqual(Object.keys(source.sourceTiles_).length, 0);
    });

    it('uses the tileUrlFunction from tile creation time', function () {
      // Simulates the race condition where a tile enqueued for key A
      // is loaded after the source URL changed to B.
      const testSource = new VectorTileSource({
        format: new MVT(),
        url: '{z}/{x}/{y}/A',
      });
      const projection = testSource.getProjection();
      const tile = testSource.getTile(0, 0, 0, 1, projection);
      assert.strictEqual(tile.getState(), TileState.IDLE);

      // Change URL, which changes the source key
      testSource.setUrl('{z}/{x}/{y}/B');

      // When the tile loads, it should use the original URL function (A),
      // not the current one (B).
      tile.load();
      assert.strictEqual(tile.sourceTiles.length, 1);
      assert.include(tile.sourceTiles[0].getTileUrl(), '/A');
    });
  });
});
