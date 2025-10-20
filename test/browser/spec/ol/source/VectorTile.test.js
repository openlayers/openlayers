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
import TileGrid from '../../../../../src/ol/tilegrid/TileGrid.js';
import {createXYZ} from '../../../../../src/ol/tilegrid.js';

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
      expect(source.format_).to.equal(format);
    });

    it('sets the default zDirection on the instance', function () {
      expect(source.zDirection).to.be(1);
    });

    it('uses ol.VectorTile as default tileClass', function () {
      expect(source.tileClass).to.equal(VectorTile);
    });

    it('creates a 512 XYZ tilegrid by default', function () {
      const tileGrid = createXYZ({tileSize: 512});
      expect(source.tileGrid.tileSize_).to.equal(tileGrid.tileSize_);
      expect(source.tileGrid.extent_).to.equal(tileGrid.extent_);
    });
  });

  describe('#getTile()', function () {
    it('creates a tile with the correct tile class', function () {
      const tile = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      expect(tile).to.be.a(VectorRenderTile);
      expect(tile.getTileCoord()).to.eql([0, 0, 0]);
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
          expect(sourceTile.getFeatures().length).to.be.greaterThan(0);
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
            expect(states).to.eql([
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
      expect(Object.keys(source.sourceTiles_).length).to.be(1);
      expect(source.tileKeysBySourceTileUrl_).to.eql({
        'spec/ol/data/point.json': ['spec/ol/data/point.json/0,0,0'],
      });
      tile.dispose();
      expect(Object.keys(source.sourceTiles_).length).to.be(0);
      expect(source.tileKeysBySourceTileUrl_).to.eql({});
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
      expect(Object.keys(source.sourceTiles_).length).to.be(3);
      expect(source.tileKeysBySourceTileUrl_).to.eql({
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
      expect(Object.keys(source.sourceTiles_).length).to.be(2);
      expect(source.tileKeysBySourceTileUrl_).to.eql({
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
      expect(tile.getState()).to.be(TileState.EMPTY);
    });

    it('creates empty tiles outside the source extent', function () {
      const fullExtent = getProjection('EPSG:3857').getExtent();
      const source = new VectorTileSource({
        extent: [fullExtent[0], fullExtent[1], 0, 0],
      });
      const tile = source.getTile(1, 1, 1, 1, source.getProjection());
      expect(tile.getState()).to.be(TileState.EMPTY);
    });

    it('creates empty tiles outside the world extent when wrapX === false', function () {
      const source = new VectorTileSource({
        wrapX: false,
      });
      const tile = source.getTile(0, -1, 0, 1, source.getProjection());
      expect(tile.getState()).to.be(TileState.EMPTY);
    });

    it('creates empty tiles when the tileUrlFunction returns undefined', function () {
      const source = new VectorTileSource({
        tileUrlFunction: function (tileCoord) {
          return;
        },
      });
      const tile = source.getTile(1, 1, 1, 1, source.getProjection());
      expect(tile.getState()).to.be(TileState.EMPTY);
    });

    it('creates non-empty tiles outside the world extent when wrapX === true', function () {
      const source = new VectorTileSource({
        url: '{z}/{x}/{y}.pbf',
      });
      const tile = source.getTile(0, -1, 0, 1, source.getProjection());
      expect(tile.getState()).to.be(TileState.IDLE);
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
      expect(tile.getState()).to.be(TileState.LOADING);
    });

    it('creates new tile when source key changes', function () {
      source.setKey('key1');
      const tile1 = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      source.setKey('key2');
      const tile2 = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      expect(tile1.key).to.be('key1');
      expect(tile2.key).to.be('key2');
    });
  });

  describe('#getTileGridForProjection', function () {
    it("creates a tile grid with the source tile grid's tile size", function () {
      const tileGrid = source.getTileGridForProjection(
        getProjection('EPSG:3857'),
      );
      expect(tileGrid.getTileSize(0)).to.be(512);
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
        expect(started).to.be(true);
        expect(e.tile).to.be.a(VectorTile);
        expect(e.tile.getFeatures().length).to.be(1327);
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
      expect(tile2.wrappedTileCoord).to.eql([14, 8938, 5680]);
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
            expect(sourceTiles.length).to.be(1);
            expect(sourceTiles[0].getState()).to.be(TileState.LOADED);
            ++loaded;
            if (loaded === 2) {
              expect(loadstart).to.be(1);
              expect(loadend).to.be(1);
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
        expect(loaded).to.eql(['5/13/-28']);
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

        expect(tileQueue.getTilesLoading()).to.be(0);
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
      expect(Object.keys(source.sourceTiles_).length).to.be.greaterThan(0);
      source.refresh();
      map.renderSync();
      expect(Object.keys(source.sourceTiles_).length).to.be(0);
    });
  });
});
