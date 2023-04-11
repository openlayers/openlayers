import Feature from '../../../../../src/ol/Feature.js';
import GeoJSON from '../../../../../src/ol/format/GeoJSON.js';
import MVT from '../../../../../src/ol/format/MVT.js';
import Map from '../../../../../src/ol/Map.js';
import TileGrid from '../../../../../src/ol/tilegrid/TileGrid.js';
import TileState from '../../../../../src/ol/TileState.js';
import VectorRenderTile from '../../../../../src/ol/VectorRenderTile.js';
import VectorTile from '../../../../../src/ol/VectorTile.js';
import VectorTileLayer from '../../../../../src/ol/layer/VectorTile.js';
import VectorTileSource from '../../../../../src/ol/source/VectorTile.js';
import View from '../../../../../src/ol/View.js';
import {createXYZ} from '../../../../../src/ol/tilegrid.js';
import {fromExtent} from '../../../../../src/ol/geom/Polygon.js';
import {get, get as getProjection} from '../../../../../src/ol/proj.js';
import {getCenter} from '../../../../../src/ol/extent.js';
import {listen, unlistenByKey} from '../../../../../src/ol/events.js';
import {unByKey} from '../../../../../src/ol/Observable.js';

describe('ol.source.VectorTile', function () {
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
      expect(source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'))).to.equal(
        tile
      );
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
            tile
          )[0];
          expect(sourceTile.getFeatures().length).to.be.greaterThan(0);
          unlistenByKey(key);
          done();
        }
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
      const fullExtent = get('EPSG:3857').getExtent();
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
        source.getProjection()
      );
      tile.load();
      expect(tile.getState()).to.be(TileState.LOADING);
    });

    it('creates new tile when source key changes', function () {
      source.setKey('key1');
      const tile1 = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      const tile2 = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      source.setKey('key2');
      const tile3 = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      expect(tile1).to.equal(tile2);
      expect(tile1.key).to.be('key1');
      expect(tile3.key).to.be('key2');
    });
  });

  describe('#getTileGridForProjection', function () {
    it("creates a tile grid with the source tile grid's tile size", function () {
      const tileGrid = source.getTileGridForProjection(
        getProjection('EPSG:3857')
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
        getProjection('EPSG:3857')
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
        getProjection('EPSG:3857')
      );
      const tile2 = source.getTile(
        14,
        8938 + Math.pow(2, 14),
        5680,
        1,
        getProjection('EPSG:3857')
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
    let source, map, loaded, target;

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

      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);

      map = new Map({
        layers: [
          new VectorTileLayer({
            extent: extent,
            source: source,
          }),
        ],
        target: target,
        view: new View({
          zoom: 11,
          center: [666373.1624999996, 7034265.3572],
        }),
      });
    });

    afterEach(function () {
      document.body.removeChild(target);
    });

    it('loads only required tiles', function (done) {
      map.renderSync();
      setTimeout(function () {
        expect(loaded).to.eql(['5/13/-28']);
        done();
      }, 0);
    });

    it('adjusts the tile cache size', function (done) {
      map.renderSync();
      setTimeout(function () {
        expect(
          source.getTileCacheForProjection(map.getView().getProjection())
            .highWaterMark
        ).to.be(2);
        expect(source.sourceTileCache.highWaterMark).to.be(2);
        done();
      }, 0);
    });
  });

  it('does not fill up the tile queue', function (done) {
    const target = document.createElement('div');
    target.style.width = '100px';
    target.style.height = '100px';
    document.body.appendChild(target);

    const urls = [
      'spec/ol/data/14-8938-5680.vector.pbf?num=0&coord={z},{x},{y}',
      'spec/ol/data/14-8938-5680.vector.pbf?num=1&coord={z},{x},{y}',
      'spec/ol/data/14-8938-5680.vector.pbf?num=2&coord={z},{x},{y}',
      'spec/ol/data/14-8938-5680.vector.pbf?num=3&coord={z},{x},{y}',
    ];

    const source = new VectorTileSource({
      format: new MVT(),
      url: urls[0],
    });

    const map = new Map({
      target: target,
      layers: [
        new VectorTileLayer({
          source: source,
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 0,
      }),
    });
    map.renderSync();

    const max = urls.length + 3;
    let count = 0;
    let tile = source.getTile(0, 0, 0, 1, map.getView().getProjection());
    tile.addEventListener('change', function onTileChange(e) {
      if (e.target.getState() !== TileState.LOADED) {
        return;
      }
      e.target.removeEventListener('change', onTileChange);

      map.once('rendercomplete', function () {
        expect(map.tileQueue_.getTilesLoading()).to.be(0);

        ++count;
        if (count === max) {
          document.body.removeChild(target);
          map.dispose();
          done();
          return;
        }

        source.setUrl(urls[count % urls.length]);
        tile = source.getTile(0, 0, 0, 1, map.getView().getProjection());
        tile.addEventListener('change', onTileChange);
      });
    });
  });

  describe('interim tile handling', function () {
    let map, source, target;

    beforeEach(function () {
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      const extent = [
        1824704.739223726, 6141868.096770482, 1827150.7241288517,
        6144314.081675608,
      ];
      source = new VectorTileSource({
        format: new MVT(),
        url: 'spec/ol/data/14-8938-5680.vector.pbf',
        minZoom: 14,
        maxZoom: 14,
      });
      map = new Map({
        pixelRatio: 1,
        target: target,
        layers: [
          new VectorTileLayer({
            extent: extent,
            source: source,
          }),
        ],
        view: new View({
          center: getCenter(extent),
          zoom: 15,
        }),
      });
    });

    afterEach(function () {
      map.setTarget(null);
      document.body.removeChild(target);
    });

    it('re-renders when source changes', function (done) {
      map.once('rendercomplete', function () {
        const key = map.on('rendercomplete', function () {
          const tile = source.getTile(
            14,
            8938,
            5680,
            1,
            map.getView().getProjection()
          );
          expect(tile.getKey()).to.be(
            'spec/ol/data/14-8938-5680.vector.pbf?new/14,8938,5680'
          );
          expect(tile.interimTile).to.be.a(VectorRenderTile);
          expect(tile.interimTile.getKey()).to.be(
            'spec/ol/data/14-8938-5680.vector.pbf/14,8938,5680'
          );
          const sourceTiles = source.getSourceTiles(
            1,
            map.getView().getProjection(),
            tile
          );
          if (sourceTiles) {
            expect(sourceTiles[0].getKey()).to.be(
              'spec/ol/data/14-8938-5680.vector.pbf?new/14,8938,5680'
            );
            unByKey(key);
            done();
          }
        });
        source.setUrl('spec/ol/data/14-8938-5680.vector.pbf?new');
      });
    });
  });

  describe('getFeatuersInExtent', function () {
    let map, source, target;

    beforeEach(function () {
      source = new VectorTileSource({
        maxZoom: 15,
        tileSize: 256,
        url: '{z}/{x}/{y}',
        tileLoadFunction: function (tile) {
          const extent = source
            .getTileGrid()
            .getTileCoordExtent(tile.tileCoord);
          const feature = new Feature(fromExtent(extent));
          feature.set('z', tile.tileCoord[0]);
          tile.setFeatures([feature]);
        },
      });
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      map = new Map({
        target: target,
        layers: [
          new VectorTileLayer({
            source: source,
          }),
        ],
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });
    });

    afterEach(function () {
      map.setTarget(null);
      document.body.removeChild(target);
    });

    it('returns an empty array when no tiles are in the cache', function () {
      source.tileCache.clear();
      const extent = map.getView().calculateExtent(map.getSize());
      expect(source.getFeaturesInExtent(extent).length).to.be(0);
    });

    it('returns features in extent for the last rendered z', function (done) {
      map.getView().setZoom(15);
      map.once('rendercomplete', function () {
        const extent = map.getView().calculateExtent(map.getSize());
        const features = source.getFeaturesInExtent(extent);
        expect(features.length).to.be(4);
        expect(features[0].get('z')).to.be(15);
        map.getView().setZoom(0);
        map.once('rendercomplete', function () {
          const extent = map.getView().calculateExtent(map.getSize());
          const features = source.getFeaturesInExtent(extent);
          expect(features.length).to.be(1);
          expect(features[0].get('z')).to.be(0);
          done();
        });
      });
    });
  });
});
