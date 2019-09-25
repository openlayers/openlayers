import ImageTile from '../../../../src/ol/ImageTile.js';
import TileState from '../../../../src/ol/TileState.js';
import {createFromTemplate} from '../../../../src/ol/tileurlfunction.js';
import {listen} from '../../../../src/ol/events.js';
import {addCommon, clearAllProjections, get as getProjection} from '../../../../src/ol/proj.js';
import {register} from '../../../../src/ol/proj/proj4.js';
import {WORLD_EXTENT} from '../../../../src/ol/proj/epsg3857.js';
import Projection from '../../../../src/ol/proj/Projection.js';
import ReprojTile from '../../../../src/ol/reproj/Tile.js';
import TileImage from '../../../../src/ol/source/TileImage.js';
import {getKeyZXY} from '../../../../src/ol/tilecoord.js';
import {createXYZ, createForProjection} from '../../../../src/ol/tilegrid.js';


describe('ol.source.TileImage', () => {
  function createSource(opt_proj, opt_tileGrid, opt_cacheSize) {
    const proj = opt_proj || 'EPSG:3857';
    return new TileImage({
      cacheSize: opt_cacheSize,
      projection: proj,
      tileGrid: opt_tileGrid ||
          createForProjection(proj, undefined, [2, 2]),
      tileUrlFunction: createFromTemplate('data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=')
    });
  }

  describe('#getTileCacheForProjection', () => {
    test('uses the cacheSize for reprojected tile caches', () => {
      const source = createSource(undefined, undefined, 42);
      const tileCache = source.getTileCacheForProjection(getProjection('EPSG:4326'));
      expect(tileCache.highWaterMark).toBe(42);
      expect(tileCache).not.toBe(source.getTileCacheForProjection(source.getProjection()));
    });
  });

  describe('#setTileGridForProjection', () => {
    test('uses the tilegrid for given projection', () => {
      const source = createSource();
      const tileGrid = createForProjection('EPSG:4326', 3, [10, 20]);
      source.setTileGridForProjection('EPSG:4326', tileGrid);
      const retrieved = source.getTileGridForProjection(getProjection('EPSG:4326'));
      expect(retrieved).toBe(tileGrid);
    });
  });

  describe('#getTileInternal', () => {
    let source, tile;

    beforeEach(() => {
      source = createSource();
      expect(source.getKey()).toBe('');
      source.getTileInternal(0, 0, 0, 1, getProjection('EPSG:3857'));
      expect(source.tileCache.getCount()).toBe(1);
      tile = source.tileCache.get(getKeyZXY(0, 0, 0));
    });

    test('gets the tile from the cache', () => {
      const returnedTile = source.getTileInternal(0, 0, 0, 1, getProjection('EPSG:3857'));
      expect(returnedTile).toBe(tile);
    });

    describe('change a dynamic param', () => {

      describe('tile is not loaded', () => {
        test('returns a tile with no interim tile', () => {
          source.getKey = function() {
            return 'key0';
          };
          const returnedTile = source.getTileInternal(0, 0, 0, 1, getProjection('EPSG:3857'));
          expect(returnedTile).not.toBe(tile);
          expect(returnedTile.key).toBe('key0');
          expect(returnedTile.interimTile).toBe(null);
        });
      });

      describe('tile is loaded', () => {
        test('returns a tile with interim tile', () => {
          source.getKey = function() {
            return 'key0';
          };
          tile.state = 2; // LOADED
          const returnedTile = source.getTileInternal(0, 0, 0, 1, getProjection('EPSG:3857'));
          expect(returnedTile).not.toBe(tile);
          expect(returnedTile.key).toBe('key0');
          expect(returnedTile.interimTile).toBe(tile);
        });
      });

      describe('tile is not loaded but interim tile is', () => {
        test('returns a tile with interim tile', () => {
          let dynamicParamsKey, returnedTile;
          source.getKey = function() {
            return dynamicParamsKey;
          };
          dynamicParamsKey = 'key0';
          tile.state = 2; // LOADED
          returnedTile = source.getTileInternal(0, 0, 0, 1, getProjection('EPSG:3857'));
          dynamicParamsKey = 'key1';
          returnedTile = source.getTileInternal(0, 0, 0, 1, getProjection('EPSG:3857'));
          expect(returnedTile).not.toBe(tile);
          expect(returnedTile.key).toBe('key1');
          expect(returnedTile.interimTile).toBe(tile);
        });
      });

    });

  });

  describe('#getTile', () => {
    test('does not do reprojection for identity', () => {
      const source3857 = createSource('EPSG:3857');
      const tile3857 = source3857.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      expect(tile3857).toBeInstanceOf(ImageTile);
      expect(tile3857).not.toBeInstanceOf(ReprojTile);

      const projXXX = new Projection({
        code: 'XXX',
        units: 'degrees'
      });
      const sourceXXX = createSource(projXXX);
      const tileXXX = sourceXXX.getTile(0, 0, 0, 1, projXXX);
      expect(tileXXX).toBeInstanceOf(ImageTile);
      expect(tileXXX).not.toBeInstanceOf(ReprojTile);
    });

    beforeEach(() => {
      proj4.defs('4326_noextentnounits', '+proj=longlat +datum=WGS84 +no_defs');
      register(proj4);
    });

    afterEach(() => {
      delete proj4.defs['4326_noextentnounits'];
      clearAllProjections();
      addCommon();
    });

    test('can handle source projection without extent and units', done => {
      const source = createSource('4326_noextentnounits', createXYZ({
        extent: [-180, -90, 180, 90],
        tileSize: [2, 2]
      }));
      const tile = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      expect(tile).toBeInstanceOf(ReprojTile);

      listen(tile, 'change', function() {
        if (tile.getState() == 2) { // LOADED
          done();
        }
      });
      tile.load();
    });

    test('can handle target projection without extent and units', done => {
      const proj = getProjection('4326_noextentnounits');
      const source = createSource();
      source.setTileGridForProjection(proj,
        createXYZ({
          extent: WORLD_EXTENT,
          tileSize: [2, 2]
        }));
      const tile = source.getTile(0, 0, 0, 1, proj);
      expect(tile).toBeInstanceOf(ReprojTile);

      listen(tile, 'change', function() {
        if (tile.getState() == 2) { // LOADED
          done();
        }
      });
      tile.load();
    });
  });

  describe('tile load events', () => {

    let source;

    beforeEach(() => {
      source = new TileImage({
        url: '{z}/{x}/{y}'
      });
    });

    test('dispatches tileloadstart and tileloadend events', () => {
      source.setTileLoadFunction(function(tile) {
        tile.setState(TileState.LOADED);
      });
      const startSpy = sinon.spy();
      source.on('tileloadstart', startSpy);
      const endSpy = sinon.spy();
      source.on('tileloadend', endSpy);
      const tile = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      tile.load();
      expect(startSpy.callCount).toBe(1);
      expect(endSpy.callCount).toBe(1);
    });

    test('works for loading-error-loading-loaded sequences', done => {
      source.setTileLoadFunction(function(tile) {
        tile.setState(
          tile.state == TileState.ERROR ? TileState.LOADED : TileState.ERROR);
      });
      const startSpy = sinon.spy();
      source.on('tileloadstart', startSpy);
      const errorSpy = sinon.spy();
      source.on('tileloaderror', function(e) {
        setTimeout(function() {
          e.tile.setState(TileState.LOADING);
          e.tile.setState(TileState.LOADED);
        }, 0);
        errorSpy();
      });
      source.on('tileloadend', function() {
        expect(startSpy.callCount).toBe(2);
        expect(errorSpy.callCount).toBe(1);
        done();
      });
      const tile = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      tile.load();
    });

    test('dispatches tileloadend events for aborted tiles', () => {
      source.setTileLoadFunction(function() {});
      const startSpy = sinon.spy();
      source.on('tileloadstart', startSpy);
      const endSpy = sinon.spy();
      source.on('tileloadend', endSpy);
      const tile = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      tile.load();
      tile.dispose();
      expect(startSpy.callCount).toBe(1);
      expect(endSpy.callCount).toBe(1);
    });
  });

});
