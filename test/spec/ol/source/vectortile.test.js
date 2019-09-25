import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import VectorRenderTile from '../../../../src/ol/VectorRenderTile.js';
import VectorTile from '../../../../src/ol/VectorTile.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import MVT from '../../../../src/ol/format/MVT.js';
import VectorTileLayer from '../../../../src/ol/layer/VectorTile.js';
import {get as getProjection, get} from '../../../../src/ol/proj.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';
import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';
import {listen, unlistenByKey} from '../../../../src/ol/events.js';
import TileState from '../../../../src/ol/TileState.js';

describe('ol.source.VectorTile', () => {

  let format, source;
  beforeEach(() => {
    format = new MVT();
    source = new VectorTileSource({
      format: format,
      url: 'spec/ol/data/{z}-{x}-{y}.vector.pbf'
    });
  });

  describe('constructor', () => {
    test('sets the format on the instance', () => {
      expect(source.format_).toBe(format);
    });

    test('sets the default zDirection on the instance', () => {
      expect(source.zDirection).toBe(1);
    });

    test('uses ol.VectorTile as default tileClass', () => {
      expect(source.tileClass).toBe(VectorTile);
    });

    test('creates a 512 XYZ tilegrid by default', () => {
      const tileGrid = createXYZ({tileSize: 512});
      expect(source.tileGrid.tileSize_).toBe(tileGrid.tileSize_);
      expect(source.tileGrid.extent_).toBe(tileGrid.extent_);
    });
  });

  describe('#getTile()', () => {

    test('creates a tile with the correct tile class', () => {
      const tile = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      expect(tile).toBeInstanceOf(VectorRenderTile);
      expect(tile.getTileCoord()).toEqual([0, 0, 0]);
      expect(source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'))).toBe(tile);
    });

    test('loads source tiles', done => {
      const source = new VectorTileSource({
        format: new GeoJSON(),
        url: 'spec/ol/data/point.json'
      });
      const tile = source.getTile(0, 0, 0, 1, source.getProjection());

      tile.load();
      const key = listen(tile, 'change', function(e) {
        if (tile.getState() === TileState.LOADED) {
          const sourceTile = source.getSourceTiles(1, source.getProjection(), tile)[0];
          expect(sourceTile.getFeatures().length).toBeGreaterThan(0);
          unlistenByKey(key);
          done();
        }
      });
    });

    test('handles empty tiles', done => {
      const source = new VectorTileSource({
        format: new GeoJSON(),
        url: ''
      });
      const tile = source.getTile(0, 0, 0, 1, source.getProjection());

      const key = listen(tile, 'change', function(e) {
        unlistenByKey(key);
        expect(tile.getState()).toBe(TileState.EMPTY);
        done();
      });
      tile.load();
    });

    test('creates empty tiles outside the source extent', () => {
      const fullExtent = get('EPSG:3857').getExtent();
      const source = new VectorTileSource({
        extent: [fullExtent[0], fullExtent[1], 0, 0]
      });
      const tile = source.getTile(1, 1, 1, 1, source.getProjection());
      expect(tile.getState()).toBe(TileState.EMPTY);
    });

    test(
      'creates empty tiles outside the world extent when wrapX === false',
      () => {
        const source = new VectorTileSource({
          wrapX: false
        });
        const tile = source.getTile(0, -1, 0, 1, source.getProjection());
        expect(tile.getState()).toBe(TileState.EMPTY);
      }
    );

    test(
      'creates non-empty tiles outside the world extent when wrapX === true',
      () => {
        const source = new VectorTileSource({});
        const tile = source.getTile(0, -1, 0, 1, source.getProjection());
        expect(tile.getState()).toBe(TileState.IDLE);
      }
    );

    test('creates non-empty tiles for overzoomed resolutions', () => {
      const source = new VectorTileSource({
        maxZoom: 16
      });
      const tile = source.getTile(24, 9119385, 5820434, 1, source.getProjection());
      tile.load();
      expect(tile.getState()).toBe(TileState.LOADING);
    });

    test('creates new tile when source key changes', () => {
      source.setKey('key1');
      const tile1 = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      const tile2 = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      source.setKey('key2');
      const tile3 = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      expect(tile1).toBe(tile2);
      expect(tile1.key).toBe('key1');
      expect(tile3.key).toBe('key2');
    });

  });

  describe('#getTileGridForProjection', () => {
    test('creates a tile grid with the source tile grid\'s tile size', () => {
      const tileGrid = source.getTileGridForProjection(getProjection('EPSG:3857'));
      expect(tileGrid.getTileSize(0)).toBe(512);
    });
  });

  describe('Tile load events', () => {
    test(
      'triggers tileloadstart and tileloadend with ol.VectorTile',
      done => {
        const tile = source.getTile(14, 8938, 5680, 1, getProjection('EPSG:3857'));
        let started = false;
        source.on('tileloadstart', function() {
          started = true;
        });
        source.on('tileloadend', function(e) {
          expect(started).toBe(true);
          expect(e.tile).toBeInstanceOf(VectorTile);
          expect(e.tile.getFeatures().length).toBe(1327);
          done();
        });
        tile.load();
      }
    );
  });

  describe('different source and render tile grids', () => {

    let source, map, loaded, requested, target;

    beforeEach(() => {

      loaded = [];
      requested = 0;

      function tileUrlFunction(tileCoord) {
        ++requested;
        if (tileCoord.toString() == '5,13,-29') {
          return tileCoord.join('/');
        }
      }

      function tileLoadFunction(tile, src) {
        tile.setLoader(function() {});
        loaded.push(src);
      }

      const extent = [665584.2026596286, 7033250.839875697, 667162.0221431496, 7035280.378636755];

      source = new VectorTileSource({
        tileGrid: new TileGrid({
          origin: [218128, 6126002],
          resolutions: [4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5]
        }),
        tileUrlFunction: tileUrlFunction,
        tileLoadFunction: tileLoadFunction
      });

      target = document.createElement('div');
      target.style.width = target.style.height = '100px';
      document.body.appendChild(target);

      map = new Map({
        layers: [
          new VectorTileLayer({
            extent: extent,
            source: source
          })
        ],
        target: target,
        view: new View({
          zoom: 11,
          center: [666373.1624999996, 7034265.3572]
        })
      });

    });

    afterEach(() => {
      document.body.removeChild(target);
    });

    test('loads available tiles', done => {
      map.renderSync();
      setTimeout(function() {
        expect(requested).toBeGreaterThan(1);
        expect(loaded).toEqual(['5/13/-29']);
        done();
      }, 0);
    });

  });

  test('does not fill up the tile queue', done => {
    const target = document.createElement('div');
    target.style.width = '100px';
    target.style.height = '100px';
    document.body.appendChild(target);

    const urls = [
      'spec/ol/data/14-8938-5680.vector.pbf?num=0&coord={z},{x},{y}',
      'spec/ol/data/14-8938-5680.vector.pbf?num=1&coord={z},{x},{y}',
      'spec/ol/data/14-8938-5680.vector.pbf?num=2&coord={z},{x},{y}',
      'spec/ol/data/14-8938-5680.vector.pbf?num=3&coord={z},{x},{y}'
    ];

    const source = new VectorTileSource({
      format: new MVT(),
      url: urls[0]
    });

    const map = new Map({
      target: target,
      layers: [
        new VectorTileLayer({
          source: source
        })
      ],
      view: new View({
        center: [0, 0],
        zoom: 0
      })
    });
    map.renderSync();


    const max = urls.length + 3;
    let count = 0;
    let tile = source.getTile(0, 0, 0, 1, map.getView().getProjection());
    tile.addEventListener('change', function onTileChange(e) {
      if (e.target.getState() !== TileState.LOADED && !e.target.hifi) {
        return;
      }
      e.target.removeEventListener('change', onTileChange);

      map.once('rendercomplete', function() {
        expect(map.tileQueue_.getTilesLoading()).toBe(0);

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

});
