import {DEFAULT_TILE_SIZE} from '../../../../src/ol/tilegrid/common.js';
import {listen} from '../../../../src/ol/events.js';
import Projection from '../../../../src/ol/proj/Projection.js';
import Zoomify, {CustomTile} from '../../../../src/ol/source/Zoomify.js';
import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';


describe('ol.source.Zoomify', () => {
  const w = 1024;
  const h = 512;
  const size = [w, h];
  const zoomifyUrl = 'spec/ol/source/images/zoomify/{TileGroup}/{z}-{x}-{y}.jpg';
  const iipUrl = 'spec/ol/source/images/zoomify?JTL={z},{tileIndex}';
  const proj = new Projection({
    code: 'ZOOMIFY',
    units: 'pixels',
    extent: [0, 0, w, h]
  });
  function getZoomifySource() {
    return new Zoomify({
      url: zoomifyUrl,
      size: size
    });
  }
  function getZoomifySourceWithExtentInFirstQuadrant() {
    return new Zoomify({
      url: zoomifyUrl,
      size: size,
      extent: [0, 0, size[0], size[1]]
    });
  }
  function getIIPSource() {
    return new Zoomify({
      url: iipUrl,
      size: size
    });
  }
  function getZoomifySourceWith1024pxTiles() {
    return new Zoomify({
      url: zoomifyUrl,
      size: size,
      tileSize: 1024
    });
  }

  describe('constructor', () => {

    test('requires config "size"', () => {
      let source;

      expect(function() {
        source = new Zoomify();
      }).toThrow();

      expect(function() {
        source = new Zoomify({});
      }).toThrow();

      expect(function() {
        source = new Zoomify({
          url: 'some-url'
        });
      }).toThrow();

      expect(function() {
        source = new Zoomify({
          size: [47, 11]
        });
      }).not.toThrow();
      expect(source).toBeInstanceOf(Zoomify);

      expect(function() {
        source = getZoomifySource();
      }).not.toThrow();
      expect(function() {
        source = getIIPSource();
      }).not.toThrow();
      expect(source).toBeInstanceOf(Zoomify);
    });

    test('does not need "tierSizeCalculation" option', () => {
      expect(function() {
        new Zoomify({
          size: [47, 11]
        });
      }).not.toThrow();
    });

    test('accepts "tierSizeCalculation" option "default"', () => {
      expect(function() {
        new Zoomify({
          size: [47, 11],
          tierSizeCalculation: 'default'
        });
      }).not.toThrow();
    });

    test('accepts "tierSizeCalculation" option "truncated"', () => {
      expect(function() {
        new Zoomify({
          size: [47, 11],
          tierSizeCalculation: 'truncated'
        });
      }).not.toThrow();
    });

    test('throws on unexpected "tierSizeCalculation" ', () => {
      expect(function() {
        new Zoomify({
          size: [47, 11],
          tierSizeCalculation: 'ace-of-spades'
        });
      }).toThrow();
    });

    test('creates a tileGrid for both protocols', () => {
      const sources = [getZoomifySource(), getIIPSource()];
      for (let i = 0; i < sources.length; i++) {
        const tileGrid = sources[i].getTileGrid();
        expect(tileGrid).toBeInstanceOf(TileGrid);
      }
    });

  });

  describe('generated tileGrid', () => {

    test('has expected extent', () => {
      const sources = [getZoomifySource(), getIIPSource()];
      for (let i = 0; i < sources.length; i++) {
        const tileGrid = sources[i].getTileGrid();
        const expectedExtent = [0, -h, w, 0];
        expect(tileGrid.getExtent()).toEqual(expectedExtent);
      }
    });

    test('has expected origin', () => {
      const sources = [getZoomifySource(), getIIPSource()];
      for (let i = 0; i < sources.length; i++) {
        const tileGrid = sources[i].getTileGrid();
        const expectedOrigin = [0, 0];
        expect(tileGrid.getOrigin()).toEqual(expectedOrigin);
      }
    });

    test('has expected resolutions', () => {
      const sources = [getZoomifySource(), getIIPSource()];
      for (let i = 0; i < sources.length; i++) {
        const tileGrid = sources[i].getTileGrid();
        const expectedResolutions = [4, 2, 1];
        expect(tileGrid.getResolutions()).toEqual(expectedResolutions);
      }
    });

    test('has expected tileSize', () => {
      const sources = [getZoomifySource(), getZoomifySourceWith1024pxTiles()];
      const expectedTileSizes = [DEFAULT_TILE_SIZE, 1024];
      for (let i = 0; i < sources.length; i++) {
        const tileGrid = sources[i].getTileGrid();
        expect(tileGrid.getTileSize()).toEqual(expectedTileSizes[i]);
      }
    });

    test('has expected extent', () => {
      const sources = [getZoomifySource(), getZoomifySourceWithExtentInFirstQuadrant()];
      const expectedExtents = [
        [0, -size[1], size[0], 0],
        [0, 0, size[0], size[1]]
      ];
      for (let i = 0; i < sources.length; i++) {
        const tileGrid = sources[i].getTileGrid();
        expect(tileGrid.getExtent()).toEqual(expectedExtents[i]);
      }
    });

    test('has expected origin', () => {
      const sources = [getZoomifySource(), getZoomifySourceWithExtentInFirstQuadrant()];
      const expectedOrigins = [
        [0, 0],
        [0, size[1]]
      ];
      for (let i = 0; i < sources.length; i++) {
        const tileGrid = sources[i].getTileGrid();
        expect(tileGrid.getOrigin()).toEqual(expectedOrigins[i]);
      }
    });

  });

  describe('tierSizeCalculation configuration', () => {

    test('influences resolutions', () => {
      // not configured at all
      const source = new Zoomify({
        url: zoomifyUrl,
        size: [513, 256]
      });
      const tileGrid = source.getTileGrid();

      // explicitly set as 'default'
      const sourceDefault = new Zoomify({
        url: zoomifyUrl,
        size: [513, 256],
        tierSizeCalculation: 'default'
      });
      const tileGridDefault = sourceDefault.getTileGrid();

      // explicitly set to 'truncated'
      const sourceTruncated = new Zoomify({
        url: zoomifyUrl,
        size: [513, 256],
        tierSizeCalculation: 'truncated'
      });
      const tileGridTruncated = sourceTruncated.getTileGrid();

      expect(tileGrid.getResolutions()).toEqual([4, 2, 1]);
      expect(tileGridDefault.getResolutions()).toEqual([4, 2, 1]);
      expect(tileGridTruncated.getResolutions()).toEqual([2, 1]);
    });

  });

  describe('generated tileUrlFunction for zoomify protocol', () => {

    test('creates an expected tileUrlFunction with zoomify template', () => {
      const source = getZoomifySource();
      const tileUrlFunction = source.getTileUrlFunction();
      expect(tileUrlFunction([0, 0, 0])).toEqual('spec/ol/source/images/zoomify/TileGroup0/0-0-0.jpg');
      expect(tileUrlFunction([1, 0, 0])).toEqual('spec/ol/source/images/zoomify/TileGroup0/1-0-0.jpg');
      expect(tileUrlFunction([1, 1, 0])).toEqual('spec/ol/source/images/zoomify/TileGroup0/1-1-0.jpg');
      expect(tileUrlFunction([1, 0, 1])).toEqual('spec/ol/source/images/zoomify/TileGroup0/1-0-1.jpg');
      expect(tileUrlFunction([1, 1, 1])).toEqual('spec/ol/source/images/zoomify/TileGroup0/1-1-1.jpg');
    });
    test('creates an expected tileUrlFunction with IIP template', () => {
      const source = getIIPSource();
      const tileUrlFunction = source.getTileUrlFunction();
      expect(tileUrlFunction([0, 0, 0])).toEqual('spec/ol/source/images/zoomify?JTL=0,0');
      expect(tileUrlFunction([1, 0, 0])).toEqual('spec/ol/source/images/zoomify?JTL=1,0');
      expect(tileUrlFunction([1, 1, 0])).toEqual('spec/ol/source/images/zoomify?JTL=1,1');
      expect(tileUrlFunction([1, 0, 1])).toEqual('spec/ol/source/images/zoomify?JTL=1,2');
      expect(tileUrlFunction([1, 1, 1])).toEqual('spec/ol/source/images/zoomify?JTL=1,3');
    });

    test('creates an expected tileUrlFunction without template', () => {
      const source = new Zoomify({
        url: 'spec/ol/source/images/zoomify/',
        size: size
      });
      const tileUrlFunction = source.getTileUrlFunction();
      expect(tileUrlFunction([0, 0, 0])).toEqual('spec/ol/source/images/zoomify/TileGroup0/0-0-0.jpg');
      expect(tileUrlFunction([1, 0, 0])).toEqual('spec/ol/source/images/zoomify/TileGroup0/1-0-0.jpg');
      expect(tileUrlFunction([1, 1, 0])).toEqual('spec/ol/source/images/zoomify/TileGroup0/1-1-0.jpg');
      expect(tileUrlFunction([1, 0, 1])).toEqual('spec/ol/source/images/zoomify/TileGroup0/1-0-1.jpg');
      expect(tileUrlFunction([1, 1, 1])).toEqual('spec/ol/source/images/zoomify/TileGroup0/1-1-1.jpg');
    });
    test('returns undefined if no tileCoord passed', () => {
      const source = getZoomifySource();
      const tileUrlFunction = source.getTileUrlFunction();
      expect(tileUrlFunction()).toBe(undefined);
    });

  });

  describe('uses a custom tileClass', () => {

    test('returns expected tileClass instances via "getTile"', () => {
      const source = getZoomifySource();
      const tile = source.getTile(0, 0, 0, 1, proj);
      expect(tile).toBeInstanceOf(CustomTile);
    });

    test('"tile.getImage" returns and caches an unloaded image', () => {
      const source = getZoomifySource();

      const tile = source.getTile(0, 0, 0, 1, proj);
      const img = tile.getImage();

      const tile2 = source.getTile(0, 0, 0, 1, proj);
      const img2 = tile2.getImage();

      expect(img).toBeInstanceOf(HTMLImageElement);
      expect(img).toBe(img2);
    });

    test('"tile.getImage" returns and caches a loaded canvas', done => {
      const source = getZoomifySource();

      const tile = source.getTile(0, 0, 0, 1, proj);

      listen(tile, 'change', function() {
        if (tile.getState() == 2) { // LOADED
          const img = tile.getImage();
          expect(img).toBeInstanceOf(HTMLCanvasElement);

          const tile2 = source.getTile(0, 0, 0, 1, proj);
          expect(tile2.getState()).toBe(2);
          const img2 = tile2.getImage();
          expect(img).toBe(img2);
          done();
        }
      });
      tile.load();
    });

  });

});
