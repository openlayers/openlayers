import {DEFAULT_MAX_ZOOM, DEFAULT_TILE_SIZE} from '../../../../src/ol/tilegrid/common.js';
import TileRange from '../../../../src/ol/TileRange.js';
import {createOrUpdate} from '../../../../src/ol/extent.js';
import {get as getProjection, METERS_PER_UNIT} from '../../../../src/ol/proj.js';
import {HALF_SIZE} from '../../../../src/ol/proj/epsg3857.js';
import Projection from '../../../../src/ol/proj/Projection.js';
import {createForExtent, createForProjection, createXYZ, getForProjection as getTileGridForProjection} from '../../../../src/ol/tilegrid.js';
import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';


describe('ol.tilegrid.TileGrid', () => {
  let resolutions;
  let origin;
  let tileSize;

  beforeEach(() => {
    resolutions = [1000, 500, 250, 100];
    origin = [0, 0];
    tileSize = 100;
  });

  describe('create valid', () => {
    test('does not throw an exception', () => {
      expect(function() {
        return new TileGrid({
          resolutions: resolutions,
          origin: origin,
          tileSize: tileSize
        });
      }).not.toThrow();
    });
  });

  describe('create with duplicate resolutions', () => {
    test('throws an exception', () => {
      expect(function() {
        return new TileGrid({
          resolutions: [100, 50, 50, 25, 10],
          origin: origin,
          tileSize: tileSize
        });
      }).toThrow();
    });
  });

  describe('create with out of order resolutions', () => {
    test('throws an exception', () => {
      const resolutions = [100, 25, 50, 10];
      expect(function() {
        return new TileGrid({
          resolutions: resolutions,
          origin: origin,
          tileSize: tileSize
        });
      }).toThrow();
    });
  });

  describe('create with multiple origins', () => {
    test('does not throw an exception', () => {
      expect(function() {
        return new TileGrid({
          resolutions: [100, 50, 25, 10],
          origins: [origin, origin, origin, origin],
          tileSize: tileSize
        });
      }).not.toThrow();
    });
  });

  describe('create with both origin and multiple origins', () => {
    test('throws an exception', () => {
      expect(function() {
        return new TileGrid({
          resolutions: [100, 50, 25, 10],
          origins: [origin, origin, origin, origin],
          origin: origin,
          tileSize: tileSize
        });
      }).toThrow();
    });
  });

  describe('create with too few origins', () => {
    test('throws an exception', () => {
      expect(function() {
        return new TileGrid({
          resolutions: [100, 50, 25, 10],
          origins: [origin, origin, origin],
          tileSize: tileSize
        });
      }).toThrow();
    });
  });

  describe('create with too many origins', () => {
    test('throws an exception', () => {
      expect(function() {
        return new TileGrid({
          resolutions: [100, 50, 25, 10],
          origins: [origin, origin, origin, origin, origin],
          tileSize: tileSize
        });
      }).toThrow();
    });
  });

  describe('create with multiple tileSizes', () => {
    test('does not throw an exception', () => {
      expect(function() {
        return new TileGrid({
          resolutions: [100, 50, 25, 10],
          tileSizes: [tileSize, tileSize, tileSize, tileSize],
          origin: origin
        });
      }).not.toThrow();
    });
  });

  describe('create with both tileSize and multiple tileSizes', () => {
    test('throws an exception', () => {
      expect(function() {
        return new TileGrid({
          resolutions: [100, 50, 25, 10],
          tileSizes: [tileSize, tileSize, tileSize, tileSize],
          tileSize: tileSize,
          origin: origin
        });
      }).toThrow();
    });
  });

  describe('create with too few tileSizes', () => {
    test('throws an exception', () => {
      expect(function() {
        return new TileGrid({
          resolutions: [100, 50, 25, 10],
          tileSizes: [tileSize, tileSize, tileSize],
          origin: origin
        });
      }).toThrow();
    });
  });

  describe('create with too many tileSizes', () => {
    test('throws an exception', () => {
      expect(function() {
        return new TileGrid({
          resolutions: [100, 50, 25, 10],
          tileSizes: [tileSize, tileSize, tileSize, tileSize, tileSize],
          origin: origin
        });
      }).toThrow();
    });
  });

  describe('create with origin', () => {
    let tileGrid;
    beforeEach(() => {
      tileGrid = new TileGrid({
        origin: [10, 20],
        tileSize: 10,
        resolutions: [1]
      });
    });

    test('returns the configured origin', () => {
      expect(tileGrid.getOrigin()).toEqual([10, 20]);
    });

    test('returns null for an unknown extent', () => {
      expect(tileGrid.getExtent()).toBe(null);
    });

    test('returns null for an unknown full tile range', () => {
      expect(tileGrid.getFullTileRange(0)).toBe(null);
    });
  });

  describe('create with extent', () => {
    let tileGrid;
    beforeEach(() => {
      tileGrid = new TileGrid({
        extent: [10, 20, 30, 40],
        tileSize: 10,
        resolutions: [1]
      });
    });

    test('assumes top left corner of extent as origin', () => {
      expect(tileGrid.getOrigin()).toEqual([10, 40]);
    });

    test('calculates full tile ranges from extent', () => {
      const fullTileRange = tileGrid.getFullTileRange(0);
      expect(fullTileRange.minX).toBe(0);
      expect(fullTileRange.maxX).toBe(1);
      expect(fullTileRange.minY).toBe(0);
      expect(fullTileRange.maxY).toBe(1);
    });
  });

  describe('create with extent and sizes', () => {
    let tileGrid;
    beforeEach(() => {
      tileGrid = new TileGrid({
        extent: [10, 20, 30, 40],
        sizes: [[3, 3]],
        tileSize: 10,
        resolutions: [1]
      });
    });

    test('returns the configured extent', () => {
      expect(tileGrid.getExtent()).toEqual([10, 20, 30, 40]);
    });

    test('calculates full tile ranges from sizes', () => {
      const fullTileRange = tileGrid.getFullTileRange(0);
      expect(fullTileRange.minX).toBe(0);
      expect(fullTileRange.maxX).toBe(2);
      expect(fullTileRange.minY).toBe(0);
      expect(fullTileRange.maxY).toBe(2);
    });
  });

  describe('create with top-left origin and sizes', () => {
    let tileGrid;
    beforeEach(() => {
      tileGrid = new TileGrid({
        origin: [10, 40],
        sizes: [[3, 3]],
        tileSize: 10,
        resolutions: [1]
      });
    });

    test('calculates correct minY and maxY for positive heights', () => {
      const fullTileRange = tileGrid.getFullTileRange(0);
      expect(fullTileRange.minY).toBe(0);
      expect(fullTileRange.maxY).toBe(2);
    });
  });

  describe('create with bottom-left origin and sizes', () => {
    let tileGrid;
    beforeEach(() => {
      tileGrid = new TileGrid({
        origin: [10, 10],
        sizes: [[3, -3]],
        tileSize: 10,
        resolutions: [1]
      });
    });

    test('calculates correct minX and maxX for negative heights', () => {
      const fullTileRange = tileGrid.getFullTileRange(0);
      expect(fullTileRange.minY).toBe(-3);
      expect(fullTileRange.maxY).toBe(-1);
    });
  });

  describe('create with extent and origin', () => {
    test('uses both origin and extent', () => {
      const tileGrid = new TileGrid({
        origin: [0, 0],
        extent: [10, 20, 30, 40],
        tileSize: 10,
        resolutions: [1]
      });
      expect(tileGrid.getOrigin()).toEqual([0, 0]);
      expect(tileGrid.getExtent()).toEqual([10, 20, 30, 40]);
    });
  });

  describe('createForExtent', () => {
    test('allows creation of tile grid from extent', () => {
      const extent = createOrUpdate(-100, -100, 100, 100);
      const grid = createForExtent(extent);
      expect(grid).toBeInstanceOf(TileGrid);

      const resolutions = grid.getResolutions();
      expect(resolutions.length).toBe(DEFAULT_MAX_ZOOM + 1);
      expect(grid.getOrigin()).toEqual([-100, 100]);
    });
  });

  describe('#zoomFactor_', () => {
    test('is set for a consistent zoom factor', () => {
      const grid = new TileGrid({
        resolutions: [10, 5, 2.5, 1.25],
        origin: origin,
        tileSize: tileSize
      });
      expect(grid.zoomFactor_).toBe(2);
    });

    test('is not set for an inconsistent zoom factor', () => {
      const grid = new TileGrid({
        resolutions: [10, 5, 3, 1.25],
        origin: origin,
        tileSize: tileSize
      });
      expect(grid.zoomFactor_).toBe(undefined);
    });
  });

  describe('createForProjection', () => {

    test('allows easier creation of a tile grid', () => {
      const projection = getProjection('EPSG:3857');
      const grid = createForProjection(projection);
      expect(grid).toBeInstanceOf(TileGrid);

      const resolutions = grid.getResolutions();
      expect(resolutions.length).toBe(DEFAULT_MAX_ZOOM + 1);
    });

    test('accepts a number of zoom levels', () => {
      const projection = getProjection('EPSG:3857');
      const grid = createForProjection(projection, 18);
      expect(grid).toBeInstanceOf(TileGrid);

      const resolutions = grid.getResolutions();
      expect(resolutions.length).toBe(19);
    });

    test('accepts a big number of zoom levels', () => {
      const projection = getProjection('EPSG:3857');
      const grid = createForProjection(projection, 23);
      expect(grid).toBeInstanceOf(TileGrid);

      const resolutions = grid.getResolutions();
      expect(resolutions.length).toBe(24);
    });

    test('works for projections unknown to the client', () => {
      const projection = new Projection(
        {code: 'EPSG:31287', units: 'm'});
      const grid = createForProjection(projection);
      const resolutions = grid.getResolutions();
      expect(resolutions[5]).toBe(360 * METERS_PER_UNIT['degrees'] /
        DEFAULT_TILE_SIZE / Math.pow(2, 5));
    });

    test('assumes origin is top-left', () => {
      const projection = getProjection('EPSG:3857');
      const grid = createForProjection(projection);
      const origin = grid.getOrigin();
      const half = HALF_SIZE;
      expect(origin).toEqual([-half, half]);
    });

    test('accepts bottom-left as corner', () => {
      const projection = getProjection('EPSG:3857');
      const grid = createForProjection(
        projection, undefined, undefined, 'bottom-left');
      const origin = grid.getOrigin();
      const half = HALF_SIZE;
      expect(origin).toEqual([-half, -half]);
    });

    test('accepts bottom-right as corner', () => {
      const projection = getProjection('EPSG:3857');
      const grid = createForProjection(
        projection, undefined, undefined, 'bottom-right');
      const origin = grid.getOrigin();
      const half = HALF_SIZE;
      expect(origin).toEqual([half, -half]);
    });

    test('accepts top-left as corner', () => {
      const projection = getProjection('EPSG:3857');
      const grid = createForProjection(
        projection, undefined, undefined, 'top-left');
      const origin = grid.getOrigin();
      const half = HALF_SIZE;
      expect(origin).toEqual([-half, half]);
    });

    test('accepts top-right as corner', () => {
      const projection = getProjection('EPSG:3857');
      const grid = createForProjection(
        projection, undefined, undefined, 'top-right');
      const origin = grid.getOrigin();
      const half = HALF_SIZE;
      expect(origin).toEqual([half, half]);
    });

  });

  describe('createXYZ()', () => {

    test('uses defaults', () => {
      const tileGrid = createXYZ();
      expect(tileGrid.getExtent()).toEqual(getProjection('EPSG:3857').getExtent());
      expect(tileGrid.getMinZoom()).toBe(0);
      expect(tileGrid.getMaxZoom()).toBe(DEFAULT_MAX_ZOOM);
      expect(tileGrid.getTileSize()).toBe(DEFAULT_TILE_SIZE);
    });

    test('respects configuration options', () => {
      const tileGrid = createXYZ({
        extent: [10, 20, 30, 40],
        minZoom: 1,
        maxZoom: 2,
        tileSize: 128
      });
      expect(tileGrid.getExtent()).toEqual([10, 20, 30, 40]);
      expect(tileGrid.getMinZoom()).toBe(1);
      expect(tileGrid.getMaxZoom()).toBe(2);
      expect(tileGrid.getTileSize()).toBe(128);
    });

  });

  describe('getForProjection', () => {

    test('gets the default tile grid for a projection', () => {
      const projection = getProjection('EPSG:3857');
      const grid = getTileGridForProjection(projection);
      expect(grid).toBeInstanceOf(TileGrid);

      const resolutions = grid.getResolutions();
      expect(resolutions.length).toBe(DEFAULT_MAX_ZOOM + 1);
      expect(grid.getTileSize()).toEqual(256);
    });

    test('stores the default tile grid on a projection', () => {
      const projection = getProjection('EPSG:3857');
      const grid = getTileGridForProjection(projection);
      const gridAgain = getTileGridForProjection(projection);

      expect(grid).toBe(gridAgain);
    });

  });

  describe('#getTileCoordChildTileRange()', () => {

    let tileGrid;
    beforeEach(() => {
      tileGrid = createForExtent(
        getProjection('EPSG:3857').getExtent(), 22);
    });

    test('returns the tile range for one zoom level deeper', () => {
      let range;

      range = tileGrid.getTileCoordChildTileRange([0, 0, 0]);
      expect(range.minX).toBe(0);
      expect(range.maxX).toBe(1);
      expect(range.minY).toBe(0);
      expect(range.maxY).toBe(1);

      range = tileGrid.getTileCoordChildTileRange([0, 1, 0]);
      expect(range.minX).toBe(2);
      expect(range.maxX).toBe(3);
      expect(range.minY).toBe(0);
      expect(range.maxY).toBe(1);

      range = tileGrid.getTileCoordChildTileRange([0, 0, 1]);
      expect(range.minX).toBe(0);
      expect(range.maxX).toBe(1);
      expect(range.minY).toBe(2);
      expect(range.maxY).toBe(3);

      range = tileGrid.getTileCoordChildTileRange([0, -1, 0]);
      expect(range.minX).toBe(-2);
      expect(range.maxX).toBe(-1);
      expect(range.minY).toBe(0);
      expect(range.maxY).toBe(1);

      range = tileGrid.getTileCoordChildTileRange([0, 0, -1]);
      expect(range.minX).toBe(0);
      expect(range.maxX).toBe(1);
      expect(range.minY).toBe(-2);
      expect(range.maxY).toBe(-1);
    });

    test('returns null for z > maxZoom', () => {
      const max = tileGrid.maxZoom;
      const range = tileGrid.getTileCoordChildTileRange([max + 1, 0, 0]);
      expect(range).toBe(null);
    });

  });

  describe('#forEachTileCoordParentTileRange()', () => {

    let tileGrid;
    beforeEach(() => {
      tileGrid = createForExtent(
        getProjection('EPSG:3857').getExtent(), 22);
    });

    test('iterates as expected', () => {

      const tileCoord = [5, 11, 21];
      const zs = [];
      const tileRanges = [];
      tileGrid.forEachTileCoordParentTileRange(
        tileCoord,
        function(z, tileRange) {
          zs.push(z);
          tileRanges.push(new TileRange(
            tileRange.minX, tileRange.maxX,
            tileRange.minY, tileRange.maxY));
          return false;
        });

      expect(zs.length).toEqual(5);
      expect(tileRanges.length).toEqual(5);

      expect(zs[0]).toEqual(4);
      expect(tileRanges[0].minX).toEqual(5);
      expect(tileRanges[0].maxX).toEqual(5);
      expect(tileRanges[0].minY).toEqual(10);
      expect(tileRanges[0].maxY).toEqual(10);

      expect(zs[1]).toEqual(3);
      expect(tileRanges[1].minX).toEqual(2);
      expect(tileRanges[1].maxX).toEqual(2);
      expect(tileRanges[1].minY).toEqual(5);
      expect(tileRanges[1].maxY).toEqual(5);

      expect(zs[2]).toEqual(2);
      expect(tileRanges[2].minX).toEqual(1);
      expect(tileRanges[2].maxX).toEqual(1);
      expect(tileRanges[2].minY).toEqual(2);
      expect(tileRanges[2].maxY).toEqual(2);

      expect(zs[3]).toEqual(1);
      expect(tileRanges[3].minX).toEqual(0);
      expect(tileRanges[3].maxX).toEqual(0);
      expect(tileRanges[3].minY).toEqual(1);
      expect(tileRanges[3].maxY).toEqual(1);

      expect(zs[4]).toEqual(0);
      expect(tileRanges[4].minX).toEqual(0);
      expect(tileRanges[4].maxX).toEqual(0);
      expect(tileRanges[4].minY).toEqual(0);
      expect(tileRanges[4].maxY).toEqual(0);

    });

  });

  describe('getResolution', () => {

    let tileGrid;
    beforeEach(() => {
      tileGrid = createForExtent(
        getProjection('EPSG:3857').getExtent(), 22);
    });

    test('returns the correct resolution at the equator', () => {
      // @see http://msdn.microsoft.com/en-us/library/aa940990.aspx
      expect(tileGrid.getResolution(0)).to.roughlyEqual(156543.04, 1e-2);
      expect(tileGrid.getResolution(1)).to.roughlyEqual(78271.52, 1e-2);
      expect(tileGrid.getResolution(2)).to.roughlyEqual(39135.76, 1e-2);
      expect(tileGrid.getResolution(3)).to.roughlyEqual(19567.88, 1e-2);
      expect(tileGrid.getResolution(4)).to.roughlyEqual(9783.94, 1e-2);
      expect(tileGrid.getResolution(5)).to.roughlyEqual(4891.97, 1e-2);
      expect(tileGrid.getResolution(6)).to.roughlyEqual(2445.98, 1e-2);
      expect(tileGrid.getResolution(7)).to.roughlyEqual(1222.99, 1e-2);
      expect(tileGrid.getResolution(8)).to.roughlyEqual(611.50, 1e-2);
      expect(tileGrid.getResolution(9)).to.roughlyEqual(305.75, 1e-2);
      expect(tileGrid.getResolution(10)).to.roughlyEqual(152.87, 1e-2);
      expect(tileGrid.getResolution(11)).to.roughlyEqual(76.44, 1e-2);
      expect(tileGrid.getResolution(12)).to.roughlyEqual(38.22, 1e-2);
      expect(tileGrid.getResolution(13)).to.roughlyEqual(19.11, 1e-2);
      expect(tileGrid.getResolution(14)).to.roughlyEqual(9.55, 1e-2);
      expect(tileGrid.getResolution(15)).to.roughlyEqual(4.78, 1e-2);
      expect(tileGrid.getResolution(16)).to.roughlyEqual(2.39, 1e-2);
      expect(tileGrid.getResolution(17)).to.roughlyEqual(1.19, 1e-2);
      expect(tileGrid.getResolution(18)).to.roughlyEqual(0.60, 1e-2);
      expect(tileGrid.getResolution(19)).to.roughlyEqual(0.30, 1e-2);
    });

  });

  describe('#getTileCoordFromCoordAndZ()', () => {

    describe('Y North, X East', () => {
      test('returns the expected TileCoord', () => {
        origin = [0, 0];
        const tileGrid = new TileGrid({
          resolutions: resolutions,
          origin: origin,
          tileSize: tileSize
        });
        let tileCoord;

        tileCoord = tileGrid.getTileCoordForCoordAndZ([0, 0], 3);
        expect(tileCoord[0]).toEqual(3);
        expect(tileCoord[1]).toEqual(0);
        expect(tileCoord[2]).toEqual(0);

        tileCoord = tileGrid.getTileCoordForCoordAndZ([0, 100000], 3);
        expect(tileCoord[0]).toEqual(3);
        expect(tileCoord[1]).toEqual(0);
        expect(tileCoord[2]).toEqual(-10);

        tileCoord = tileGrid.getTileCoordForCoordAndZ([100000, 0], 3);
        expect(tileCoord[0]).toEqual(3);
        expect(tileCoord[1]).toEqual(10);
        expect(tileCoord[2]).toEqual(0);

        tileCoord = tileGrid.getTileCoordForCoordAndZ([100000, 100000], 3);
        expect(tileCoord[0]).toEqual(3);
        expect(tileCoord[1]).toEqual(10);
        expect(tileCoord[2]).toEqual(-10);
      });
    });

    describe('Y South, X East', () => {
      test('returns the expected TileCoord', () => {
        origin = [0, 100000];
        const tileGrid = new TileGrid({
          resolutions: resolutions,
          origin: origin,
          tileSize: tileSize
        });
        let tileCoord;

        tileCoord = tileGrid.getTileCoordForCoordAndZ([0, 0], 3);
        expect(tileCoord[0]).toEqual(3);
        expect(tileCoord[1]).toEqual(0);
        expect(tileCoord[2]).toEqual(10);

        tileCoord = tileGrid.getTileCoordForCoordAndZ([0, 100000], 3);
        expect(tileCoord[0]).toEqual(3);
        expect(tileCoord[1]).toEqual(0);
        expect(tileCoord[2]).toEqual(0);

        tileCoord = tileGrid.getTileCoordForCoordAndZ([100000, 0], 3);
        expect(tileCoord[0]).toEqual(3);
        expect(tileCoord[1]).toEqual(10);
        expect(tileCoord[2]).toEqual(10);

        tileCoord = tileGrid.getTileCoordForCoordAndZ([100000, 100000], 3);
        expect(tileCoord[0]).toEqual(3);
        expect(tileCoord[1]).toEqual(10);
        expect(tileCoord[2]).toEqual(0);
      });
    });
  });

  describe('getTileCoordForCoordAndResolution', () => {
    test('returns the expected TileCoord', () => {
      const tileSize = 256;
      const tileGrid = new TileGrid({
        resolutions: [10],
        origin: origin,
        tileSize: tileSize
      });

      let coordinate;
      let tileCoord;

      // gets the first tile at the origin
      coordinate = [0, 0];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      expect(tileCoord[0]).toEqual(0);
      expect(tileCoord[1]).toEqual(0);
      expect(tileCoord[2]).toEqual(0);

      // gets one tile northwest of the origin
      coordinate = [-1280, 1280];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      expect(tileCoord[0]).toEqual(0);
      expect(tileCoord[1]).toEqual(-1);
      expect(tileCoord[2]).toEqual(-1);

      // gets one tile northeast of the origin
      coordinate = [1280, 1280];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      expect(tileCoord[0]).toEqual(0);
      expect(tileCoord[1]).toEqual(0);
      expect(tileCoord[2]).toEqual(-1);

      // gets one tile southeast of the origin
      coordinate = [1280, -1280];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      expect(tileCoord[0]).toEqual(0);
      expect(tileCoord[1]).toEqual(0);
      expect(tileCoord[2]).toEqual(0);

      // gets one tile southwest of the origin
      coordinate = [-1280, -1280];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      expect(tileCoord[0]).toEqual(0);
      expect(tileCoord[1]).toEqual(-1);
      expect(tileCoord[2]).toEqual(0);

      // gets the tile to the east when on the edge
      coordinate = [2560, -1280];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      expect(tileCoord[0]).toEqual(0);
      expect(tileCoord[1]).toEqual(1);
      expect(tileCoord[2]).toEqual(0);

      // gets the tile to the south when on the edge
      coordinate = [1280, -2560];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      expect(tileCoord[0]).toEqual(0);
      expect(tileCoord[1]).toEqual(0);
      expect(tileCoord[2]).toEqual(1);

      // pixels are top aligned to the origin
      coordinate = [1280, -2559.999];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      expect(tileCoord[0]).toEqual(0);
      expect(tileCoord[1]).toEqual(0);
      expect(tileCoord[2]).toEqual(0);

      // pixels are left aligned to the origin
      coordinate = [2559.999, -1280];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      expect(tileCoord[0]).toEqual(0);
      expect(tileCoord[1]).toEqual(0);
      expect(tileCoord[2]).toEqual(0);
    });
  });


  describe('getTileCoordForXYAndResolution_', () => {
    test('returns higher tile coord for intersections by default', () => {
      const tileGrid = new TileGrid({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize
      });

      let tileCoord;

      // gets higher tile for edge intersection
      tileCoord = tileGrid.getTileCoordForXYAndResolution_(
        0, 0, 100, false);
      expect(tileCoord[0]).toEqual(3);
      expect(tileCoord[1]).toEqual(0);
      expect(tileCoord[2]).toEqual(0);

      // gets higher tile for edge intersection
      tileCoord = tileGrid.getTileCoordForXYAndResolution_(
        100000, 100000, 100, false);
      expect(tileCoord[0]).toEqual(3);
      expect(tileCoord[1]).toEqual(10);
      expect(tileCoord[2]).toEqual(-10);

    });

    test('handles alt intersection policy', () => {
      const tileGrid = new TileGrid({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize
      });

      let tileCoord;

      // can get lower tile for edge intersection
      tileCoord = tileGrid.getTileCoordForXYAndResolution_(0, 0, 100, true);
      expect(tileCoord[0]).toEqual(3);
      expect(tileCoord[1]).toEqual(-1);
      expect(tileCoord[2]).toEqual(-1);

      // can get lower tile for edge intersection
      tileCoord = tileGrid.getTileCoordForXYAndResolution_(100000, 100000, 100, true);
      expect(tileCoord[0]).toEqual(3);
      expect(tileCoord[1]).toEqual(9);
      expect(tileCoord[2]).toEqual(-11);

    });

  });

  describe('getTileCoordCenter', () => {
    test('returns the expected center', () => {
      const tileGrid = new TileGrid({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize
      });
      let center;

      center = tileGrid.getTileCoordCenter([0, 0, 0]);
      expect(center[0]).toEqual(50000);
      expect(center[1]).toEqual(-50000);

      center = tileGrid.getTileCoordCenter([3, 0, 0]);
      expect(center[0]).toEqual(5000);
      expect(center[1]).toEqual(-5000);

      center = tileGrid.getTileCoordCenter([3, 9, 9]);
      expect(center[0]).toEqual(95000);
      expect(center[1]).toEqual(-95000);
    });
  });

  describe('getTileCoordExtent', () => {
    test('returns the expected extend', () => {
      const tileGrid = new TileGrid({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize
      });
      let tileCoordExtent;

      tileCoordExtent = tileGrid.getTileCoordExtent([0, 0, 0]);
      expect(tileCoordExtent[0]).toEqual(0);
      expect(tileCoordExtent[1]).toEqual(-100000);
      expect(tileCoordExtent[2]).toEqual(100000);
      expect(tileCoordExtent[3]).toEqual(0);

      tileCoordExtent = tileGrid.getTileCoordExtent([3, 9, 0]);
      expect(tileCoordExtent[0]).toEqual(90000);
      expect(tileCoordExtent[1]).toEqual(-10000);
      expect(tileCoordExtent[2]).toEqual(100000);
      expect(tileCoordExtent[3]).toEqual(0);

      tileCoordExtent = tileGrid.getTileCoordExtent([3, 0, 9]);
      expect(tileCoordExtent[0]).toEqual(0);
      expect(tileCoordExtent[1]).toEqual(-100000);
      expect(tileCoordExtent[2]).toEqual(10000);
      expect(tileCoordExtent[3]).toEqual(-90000);
    });
  });

  describe('getTileRangeForExtentAndZ', () => {
    test('returns the expected TileRange', () => {
      const tileGrid = new TileGrid({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize
      });
      const e = [45000, 5000, 55000, 15000];
      let tileRange;

      tileRange = tileGrid.getTileRangeForExtentAndZ(e, 0);
      expect(tileRange.minY).toEqual(-1);
      expect(tileRange.minX).toEqual(0);
      expect(tileRange.maxX).toEqual(0);
      expect(tileRange.maxY).toEqual(-1);

      tileRange = tileGrid.getTileRangeForExtentAndZ(e, 1);
      expect(tileRange.minX).toEqual(0);
      expect(tileRange.minY).toEqual(-1);
      expect(tileRange.maxX).toEqual(1);
      expect(tileRange.maxY).toEqual(-1);

      tileRange = tileGrid.getTileRangeForExtentAndZ(e, 2);
      expect(tileRange.minX).toEqual(1);
      expect(tileRange.minY).toEqual(-1);
      expect(tileRange.maxX).toEqual(2);
      expect(tileRange.maxY).toEqual(-1);

      tileRange = tileGrid.getTileRangeForExtentAndZ(e, 3);
      expect(tileRange.minX).toEqual(4);
      expect(tileRange.minY).toEqual(-2);
      expect(tileRange.maxX).toEqual(5);
      expect(tileRange.maxY).toEqual(-1);
    });
  });

  describe('getTileSize', () => {

    const resolutions = [1000, 500, 250, 100];
    const origin = [0, 0];

    test('works with one tile size as number', () => {
      const tileGrid = new TileGrid({
        tileSize: 256,
        resolutions: resolutions,
        origin: origin
      });
      expect(tileGrid.getTileSize(0)).toBe(256);
      expect(tileGrid.getTileSize(3)).toBe(256);
    });

    test('works with one tile size as array', () => {
      const tileGrid = new TileGrid({
        tileSize: [512, 256],
        resolutions: resolutions,
        origin: origin
      });
      expect(tileGrid.getTileSize(0)).toEqual([512, 256]);
      expect(tileGrid.getTileSize(3)).toEqual([512, 256]);
    });

    test('works with multiple tile sizes as number', () => {
      const tileGrid = new TileGrid({
        tileSizes: [256, 256, 256, 512],
        resolutions: resolutions,
        origin: origin
      });
      expect(tileGrid.getTileSize(0)).toBe(256);
      expect(tileGrid.getTileSize(3)).toBe(512);
    });

    test('works with multiple tile sizes as array', () => {
      const tileGrid = new TileGrid({
        tileSizes: [[512, 256], [512, 256], [512, 256], [640, 320]],
        resolutions: resolutions,
        origin: origin
      });
      expect(tileGrid.getTileSize(0)).toEqual([512, 256]);
      expect(tileGrid.getTileSize(3)).toEqual([640, 320]);
    });

  });

  describe('forEachTileCoord', () => {
    test('calls the provided function with each tile coordinate', () => {
      const tileGrid = createXYZ({extent: [-180, -90, 180, 90]});
      const tileCoords = [];
      tileGrid.forEachTileCoord([15, 47, 16, 48], 8, function(tileCoord) {
        tileCoords.push(tileCoord);
      });
      expect(tileCoords).toEqual([
        [8, 138, 29],
        [8, 138, 30],
        [8, 139, 29],
        [8, 139, 30]
      ]);
    });
  });

  describe('forEachTileCoordParentTileRange', () => {
    test('iterates as expected', () => {
      const tileGrid = new TileGrid({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize
      });
      const zs = [];
      const tileRanges = [];

      tileGrid.forEachTileCoordParentTileRange(
        [3, 7, 3],
        function(z, tileRange) {
          zs.push(z);
          tileRanges.push(tileRange);
          return false;
        });

      expect(zs.length).toEqual(3);
      expect(tileRanges.length).toEqual(3);

      expect(zs[0]).toEqual(2);
      expect(tileRanges[0].minX).toEqual(2);
      expect(tileRanges[0].minY).toEqual(1);
      expect(tileRanges[0].maxX).toEqual(3);
      expect(tileRanges[0].maxY).toEqual(1);

      expect(zs[1]).toEqual(1);
      expect(tileRanges[1].minX).toEqual(1);
      expect(tileRanges[1].minY).toEqual(0);
      expect(tileRanges[1].maxX).toEqual(1);
      expect(tileRanges[1].maxY).toEqual(0);

      expect(zs[2]).toEqual(0);
      expect(tileRanges[2].minX).toEqual(0);
      expect(tileRanges[2].minY).toEqual(0);
      expect(tileRanges[2].maxX).toEqual(0);
      expect(tileRanges[2].maxY).toEqual(0);
    });
  });

  describe('getZForResolution (exact)', () => {
    test('returns the expected z value', () => {
      const tileGrid = new TileGrid({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize
      });

      expect(tileGrid.getZForResolution(1000)).toEqual(0);
      expect(tileGrid.getZForResolution(500)).toEqual(1);
      expect(tileGrid.getZForResolution(250)).toEqual(2);
      expect(tileGrid.getZForResolution(100)).toEqual(3);
    });
  });

  describe('getZForResolution (approximate)', () => {
    test('returns the expected z value', () => {
      const tileGrid = new TileGrid({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize
      });

      expect(tileGrid.getZForResolution(2000)).toEqual(0);
      expect(tileGrid.getZForResolution(1000)).toEqual(0);
      expect(tileGrid.getZForResolution(900)).toEqual(0);
      expect(tileGrid.getZForResolution(750)).toEqual(1);
      expect(tileGrid.getZForResolution(625)).toEqual(1);
      expect(tileGrid.getZForResolution(500)).toEqual(1);
      expect(tileGrid.getZForResolution(475)).toEqual(1);
      expect(tileGrid.getZForResolution(375)).toEqual(2);
      expect(tileGrid.getZForResolution(250)).toEqual(2);
      expect(tileGrid.getZForResolution(200)).toEqual(2);
      expect(tileGrid.getZForResolution(125)).toEqual(3);
      expect(tileGrid.getZForResolution(100)).toEqual(3);
      expect(tileGrid.getZForResolution(50)).toEqual(3);
    });
  });

  describe('getZForResolution (lower)', () => {
    test('returns the expected z value', () => {
      const tileGrid = new TileGrid({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize
      });

      expect(tileGrid.getZForResolution(2000, 1)).toEqual(0);
      expect(tileGrid.getZForResolution(1000, 1)).toEqual(0);
      expect(tileGrid.getZForResolution(900, 1)).toEqual(0);
      expect(tileGrid.getZForResolution(750, 1)).toEqual(0);
      expect(tileGrid.getZForResolution(625, 1)).toEqual(0);
      expect(tileGrid.getZForResolution(500, 1)).toEqual(1);
      expect(tileGrid.getZForResolution(475, 1)).toEqual(1);
      expect(tileGrid.getZForResolution(375, 1)).toEqual(1);
      expect(tileGrid.getZForResolution(250, 1)).toEqual(2);
      expect(tileGrid.getZForResolution(200, 1)).toEqual(2);
      expect(tileGrid.getZForResolution(125, 1)).toEqual(2);
      expect(tileGrid.getZForResolution(100, 1)).toEqual(3);
      expect(tileGrid.getZForResolution(50, 1)).toEqual(3);
    });
  });

  describe('getZForResolution (higher)', () => {
    test('returns the expected z value', () => {
      const tileGrid = new TileGrid({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize
      });

      expect(tileGrid.getZForResolution(2000, -1)).toEqual(0);
      expect(tileGrid.getZForResolution(1000, -1)).toEqual(0);
      expect(tileGrid.getZForResolution(900, -1)).toEqual(1);
      expect(tileGrid.getZForResolution(750, -1)).toEqual(1);
      expect(tileGrid.getZForResolution(625, -1)).toEqual(1);
      expect(tileGrid.getZForResolution(500, -1)).toEqual(1);
      expect(tileGrid.getZForResolution(475, -1)).toEqual(2);
      expect(tileGrid.getZForResolution(375, -1)).toEqual(2);
      expect(tileGrid.getZForResolution(250, -1)).toEqual(2);
      expect(tileGrid.getZForResolution(200, -1)).toEqual(3);
      expect(tileGrid.getZForResolution(125, -1)).toEqual(3);
      expect(tileGrid.getZForResolution(100, -1)).toEqual(3);
      expect(tileGrid.getZForResolution(50, -1)).toEqual(3);
    });
  });
});
