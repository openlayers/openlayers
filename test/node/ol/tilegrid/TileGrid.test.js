import {assert} from 'chai';
import TileRange from '../../../../src/ol/TileRange.js';
import {createOrUpdate} from '../../../../src/ol/extent.js';
import {get as getProjection} from '../../../../src/ol/proj.js';
import Projection from '../../../../src/ol/proj/Projection.js';
import {METERS_PER_UNIT} from '../../../../src/ol/proj/Units.js';
import {HALF_SIZE} from '../../../../src/ol/proj/epsg3857.js';
import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';
import {
  DEFAULT_MAX_ZOOM,
  DEFAULT_TILE_SIZE,
} from '../../../../src/ol/tilegrid/common.js';

import {
  createForExtent,
  createForProjection,
  createXYZ,
  getForProjection as getTileGridForProjection,
} from '../../../../src/ol/tilegrid.js';

describe('ol/tilegrid/TileGrid.js', function () {
  let resolutions;
  let origin;
  let tileSize;

  beforeEach(function () {
    resolutions = [1000, 500, 250, 100];
    origin = [0, 0];
    tileSize = 100;
  });

  describe('create valid', function () {
    it('does not throw an exception', function () {
      assert.doesNotThrow(function () {
        return new TileGrid({
          resolutions: resolutions,
          origin: origin,
          tileSize: tileSize,
        });
      });
    });
  });

  describe('create with duplicate resolutions', function () {
    it('throws an exception', function () {
      assert.throws(function () {
        return new TileGrid({
          resolutions: [100, 50, 50, 25, 10],
          origin: origin,
          tileSize: tileSize,
        });
      });
    });
  });

  describe('create with out of order resolutions', function () {
    it('throws an exception', function () {
      const resolutions = [100, 25, 50, 10];
      assert.throws(function () {
        return new TileGrid({
          resolutions: resolutions,
          origin: origin,
          tileSize: tileSize,
        });
      });
    });
  });

  describe('create with multiple origins', function () {
    it('does not throw an exception', function () {
      assert.doesNotThrow(function () {
        return new TileGrid({
          resolutions: [100, 50, 25, 10],
          origins: [origin, origin, origin, origin],
          tileSize: tileSize,
        });
      });
    });
  });

  describe('create with both origin and multiple origins', function () {
    it('throws an exception', function () {
      assert.throws(function () {
        return new TileGrid({
          resolutions: [100, 50, 25, 10],
          origins: [origin, origin, origin, origin],
          origin: origin,
          tileSize: tileSize,
        });
      });
    });
  });

  describe('create with too few origins', function () {
    it('throws an exception', function () {
      assert.throws(function () {
        return new TileGrid({
          resolutions: [100, 50, 25, 10],
          origins: [origin, origin, origin],
          tileSize: tileSize,
        });
      });
    });
  });

  describe('create with too many origins', function () {
    it('throws an exception', function () {
      assert.throws(function () {
        return new TileGrid({
          resolutions: [100, 50, 25, 10],
          origins: [origin, origin, origin, origin, origin],
          tileSize: tileSize,
        });
      });
    });
  });

  describe('create with multiple tileSizes', function () {
    it('does not throw an exception', function () {
      assert.doesNotThrow(function () {
        return new TileGrid({
          resolutions: [100, 50, 25, 10],
          tileSizes: [tileSize, tileSize, tileSize, tileSize],
          origin: origin,
        });
      });
    });
  });

  describe('create with both tileSize and multiple tileSizes', function () {
    it('throws an exception', function () {
      assert.throws(function () {
        return new TileGrid({
          resolutions: [100, 50, 25, 10],
          tileSizes: [tileSize, tileSize, tileSize, tileSize],
          tileSize: tileSize,
          origin: origin,
        });
      });
    });
  });

  describe('create with too few tileSizes', function () {
    it('throws an exception', function () {
      assert.throws(function () {
        return new TileGrid({
          resolutions: [100, 50, 25, 10],
          tileSizes: [tileSize, tileSize, tileSize],
          origin: origin,
        });
      });
    });
  });

  describe('create with too many tileSizes', function () {
    it('throws an exception', function () {
      assert.throws(function () {
        return new TileGrid({
          resolutions: [100, 50, 25, 10],
          tileSizes: [tileSize, tileSize, tileSize, tileSize, tileSize],
          origin: origin,
        });
      });
    });
  });

  describe('create with origin', function () {
    let tileGrid;
    beforeEach(function () {
      tileGrid = new TileGrid({
        origin: [10, 20],
        tileSize: 10,
        resolutions: [1],
      });
    });

    it('returns the configured origin', function () {
      assert.deepEqual(tileGrid.getOrigin(), [10, 20]);
    });

    it('returns null for an unknown extent', function () {
      assert.equal(tileGrid.getExtent(), null);
    });

    it('returns null for an unknown full tile range', function () {
      assert.equal(tileGrid.getFullTileRange(0), null);
    });
  });

  describe('create with extent', function () {
    let tileGrid;
    beforeEach(function () {
      tileGrid = new TileGrid({
        extent: [10, 20, 30, 40],
        tileSize: 10,
        resolutions: [1],
      });
    });

    it('assumes top left corner of extent as origin', function () {
      assert.deepEqual(tileGrid.getOrigin(), [10, 40]);
    });

    it('calculates full tile ranges from extent', function () {
      const fullTileRange = tileGrid.getFullTileRange(0);
      assert.equal(fullTileRange.minX, 0);
      assert.equal(fullTileRange.maxX, 1);
      assert.equal(fullTileRange.minY, 0);
      assert.equal(fullTileRange.maxY, 1);
    });
  });

  describe('create with sizes', function () {
    let tileGrid;
    beforeEach(function () {
      tileGrid = new TileGrid({
        origin: [10, 40],
        sizes: [[3, 3]],
        tileSize: 10,
        resolutions: [1],
      });
    });

    it('calculates full tile ranges from sizes', function () {
      const fullTileRange = tileGrid.getFullTileRange(0);
      assert.equal(fullTileRange.minX, 0);
      assert.equal(fullTileRange.maxX, 2);
      assert.equal(fullTileRange.minY, 0);
      assert.equal(fullTileRange.maxY, 2);
    });
  });

  describe('create with extent and sizes', function () {
    let tileGrid;
    beforeEach(function () {
      tileGrid = new TileGrid({
        extent: [10, 20, 30, 40],
        sizes: [[3, 3]],
        tileSize: 10,
        resolutions: [1],
      });
    });

    it('returns the configured extent', function () {
      assert.deepEqual(tileGrid.getExtent(), [10, 20, 30, 40]);
    });

    it('calculates full tile ranges from sizes, further limited by extent', function () {
      const fullTileRange = tileGrid.getFullTileRange(0);
      assert.equal(fullTileRange.minX, 0);
      assert.equal(fullTileRange.maxX, 1);
      assert.equal(fullTileRange.minY, 0);
      assert.equal(fullTileRange.maxY, 1);
    });
  });

  describe('create with extent', function () {
    let tileGrid;
    beforeEach(function () {
      tileGrid = new TileGrid({
        extent: [10, 20, 30, 40],
        tileSize: 10,
        resolutions: [1],
      });
    });

    it('calculates full tile ranges from extent', function () {
      const fullTileRange = tileGrid.getFullTileRange(0);
      assert.equal(fullTileRange.minX, 0);
      assert.equal(fullTileRange.maxX, 1);
      assert.equal(fullTileRange.minY, 0);
      assert.equal(fullTileRange.maxY, 1);
    });
  });

  describe('create with top-left origin and sizes', function () {
    let tileGrid;
    beforeEach(function () {
      tileGrid = new TileGrid({
        origin: [10, 40],
        sizes: [[3, 3]],
        tileSize: 10,
        resolutions: [1],
      });
    });

    it('calculates correct minY and maxY for positive heights', function () {
      const fullTileRange = tileGrid.getFullTileRange(0);
      assert.equal(fullTileRange.minY, 0);
      assert.equal(fullTileRange.maxY, 2);
    });
  });

  describe('create with bottom-left origin and sizes', function () {
    let tileGrid;
    beforeEach(function () {
      tileGrid = new TileGrid({
        origin: [10, 10],
        sizes: [[3, -3]],
        tileSize: 10,
        resolutions: [1],
      });
    });

    it('calculates correct minX and maxX for negative heights', function () {
      const fullTileRange = tileGrid.getFullTileRange(0);
      assert.equal(fullTileRange.minY, -3);
      assert.equal(fullTileRange.maxY, -1);
    });
  });

  describe('create with extent and origin', function () {
    it('uses both origin and extent', function () {
      const tileGrid = new TileGrid({
        origin: [0, 0],
        extent: [10, 20, 30, 40],
        tileSize: 10,
        resolutions: [1],
      });
      assert.deepEqual(tileGrid.getOrigin(), [0, 0]);
      assert.deepEqual(tileGrid.getExtent(), [10, 20, 30, 40]);
    });
  });

  describe('create with complex configuration', function () {
    let tileGrid;
    beforeEach(function () {
      tileGrid = new TileGrid({
        extent: [
          343870.8496458133, 5809157.009546259, 1905238.0275122682,
          7515502.7821859205,
        ],
        sizes: [
          [1, 2],
          [2, 4],
          [2, 4],
          [11, 16],
        ],
        resolutions: [
          4174.778550445067, 2087.3892752225333, 1043.6946376112667,
          521.8473188056333,
        ],
        tileSizes: [
          [374, 204],
          [374, 204],
          [748, 409],
          [272, 204],
        ],
      });
    });

    it('creates correct tile ranges', function () {
      const tileRanges = [
        {minX: 0, maxX: 0, minY: 0, maxY: 1},
        {minX: 0, maxX: 1, minY: 0, maxY: 3},
        {minX: 0, maxX: 1, minY: 0, maxY: 3},
        {minX: 0, maxX: 10, minY: 0, maxY: 15},
      ];
      for (let z = 0; z <= 3; ++z) {
        const zTileRange = tileGrid.getFullTileRange(z);
        for (const property in tileRanges[z]) {
          assert.strictEqual(zTileRange[property], tileRanges[z][property]);
        }
      }
    });

    it('returns correct withinExtentAndZ results with containsXY', function () {
      const outOfRangeTileCoords = [
        [1, 2, 0],
        [1, 2, 1],
        [1, 2, 2],
        [1, 2, 3],
      ];
      outOfRangeTileCoords.forEach(function (tileCoord) {
        const tileRange = tileGrid.getFullTileRange(tileCoord[0]);
        assert.strictEqual(
          tileRange.containsXY(tileCoord[1], tileCoord[2]),
          false,
        );
      });
    });
  });

  it('calculates implicit minZoom from resolutions', function () {
    resolutions.unshift(undefined, undefined);
    const tileGrid = new TileGrid({
      resolutions,
      origin,
      tileSize,
    });
    assert.strictEqual(tileGrid.getMinZoom(), 2);
  });

  describe('createForExtent', function () {
    it('allows creation of tile grid from extent', function () {
      const extent = createOrUpdate(-100, -100, 100, 100);
      const grid = createForExtent(extent);
      assert.instanceOf(grid, TileGrid);

      const resolutions = grid.getResolutions();
      assert.strictEqual(resolutions.length, DEFAULT_MAX_ZOOM + 1);
      assert.deepEqual(grid.getOrigin(), [-100, 100]);
    });
  });

  describe('#zoomFactor_', function () {
    it('is set for a consistent zoom factor', function () {
      const grid = new TileGrid({
        resolutions: [10, 5, 2.5, 1.25],
        origin: origin,
        tileSize: tileSize,
      });
      assert.strictEqual(grid.zoomFactor_, 2);
    });

    it('is not set for an inconsistent zoom factor', function () {
      const grid = new TileGrid({
        resolutions: [10, 5, 3, 1.25],
        origin: origin,
        tileSize: tileSize,
      });
      assert.strictEqual(grid.zoomFactor_, undefined);
    });
  });

  describe('createForProjection', function () {
    it('allows easier creation of a tile grid', function () {
      const projection = getProjection('EPSG:3857');
      const grid = createForProjection(projection);
      assert.instanceOf(grid, TileGrid);

      const resolutions = grid.getResolutions();
      assert.strictEqual(resolutions.length, DEFAULT_MAX_ZOOM + 1);
    });

    it('accepts a number of zoom levels', function () {
      const projection = getProjection('EPSG:3857');
      const grid = createForProjection(projection, 18);
      assert.instanceOf(grid, TileGrid);

      const resolutions = grid.getResolutions();
      assert.strictEqual(resolutions.length, 19);
    });

    it('accepts a big number of zoom levels', function () {
      const projection = getProjection('EPSG:3857');
      const grid = createForProjection(projection, 23);
      assert.instanceOf(grid, TileGrid);

      const resolutions = grid.getResolutions();
      assert.strictEqual(resolutions.length, 24);
    });

    it('works for projections unknown to the client', function () {
      const projection = new Projection({code: 'EPSG:31287', units: 'm'});
      const grid = createForProjection(projection);
      const resolutions = grid.getResolutions();
      assert.strictEqual(
        resolutions[5],
        (360 * METERS_PER_UNIT.degrees) / DEFAULT_TILE_SIZE / Math.pow(2, 5),
      );
    });

    it('assumes origin is top-left', function () {
      const projection = getProjection('EPSG:3857');
      const grid = createForProjection(projection);
      const origin = grid.getOrigin();
      const half = HALF_SIZE;
      assert.deepEqual(origin, [-half, half]);
    });

    it('accepts bottom-left as corner', function () {
      const projection = getProjection('EPSG:3857');
      const grid = createForProjection(
        projection,
        undefined,
        undefined,
        'bottom-left',
      );
      const origin = grid.getOrigin();
      const half = HALF_SIZE;
      assert.deepEqual(origin, [-half, -half]);
    });

    it('accepts bottom-right as corner', function () {
      const projection = getProjection('EPSG:3857');
      const grid = createForProjection(
        projection,
        undefined,
        undefined,
        'bottom-right',
      );
      const origin = grid.getOrigin();
      const half = HALF_SIZE;
      assert.deepEqual(origin, [half, -half]);
    });

    it('accepts top-left as corner', function () {
      const projection = getProjection('EPSG:3857');
      const grid = createForProjection(
        projection,
        undefined,
        undefined,
        'top-left',
      );
      const origin = grid.getOrigin();
      const half = HALF_SIZE;
      assert.deepEqual(origin, [-half, half]);
    });

    it('accepts top-right as corner', function () {
      const projection = getProjection('EPSG:3857');
      const grid = createForProjection(
        projection,
        undefined,
        undefined,
        'top-right',
      );
      const origin = grid.getOrigin();
      const half = HALF_SIZE;
      assert.deepEqual(origin, [half, half]);
    });
  });

  describe('createXYZ()', function () {
    it('uses defaults', function () {
      const tileGrid = createXYZ();
      assert.deepEqual(
        tileGrid.getExtent(),
        getProjection('EPSG:3857').getExtent(),
      );
      assert.equal(tileGrid.getMinZoom(), 0);
      assert.equal(tileGrid.getMaxZoom(), DEFAULT_MAX_ZOOM);
      assert.equal(tileGrid.getTileSize(), DEFAULT_TILE_SIZE);
    });

    it('respects configuration options', function () {
      const tileGrid = createXYZ({
        extent: [10, 20, 30, 40],
        maxResolution: 10 / 128,
        minZoom: 1,
        maxZoom: 2,
        tileSize: 128,
      });
      assert.deepEqual(tileGrid.getExtent(), [10, 20, 30, 40]);
      assert.deepEqual(tileGrid.getResolutions(), [
        10 / 128,
        5 / 128,
        2.5 / 128,
      ]);
      assert.equal(tileGrid.getMinZoom(), 1);
      assert.equal(tileGrid.getMaxZoom(), 2);
      assert.equal(tileGrid.getTileSize(), 128);
    });
  });

  describe('getForProjection', function () {
    it('gets the default tile grid for a projection', function () {
      const projection = getProjection('EPSG:3857');
      const grid = getTileGridForProjection(projection);
      assert.instanceOf(grid, TileGrid);

      const resolutions = grid.getResolutions();
      assert.strictEqual(resolutions.length, DEFAULT_MAX_ZOOM + 1);
      assert.deepEqual(grid.getTileSize(), 256);
    });

    it('stores the default tile grid on a projection', function () {
      const projection = getProjection('EPSG:3857');
      const grid = getTileGridForProjection(projection);
      const gridAgain = getTileGridForProjection(projection);

      assert.strictEqual(grid, gridAgain);
    });
  });

  describe('#getTileCoordChildTileRange()', function () {
    let tileGrid;
    beforeEach(function () {
      tileGrid = createForExtent(getProjection('EPSG:3857').getExtent(), 22);
    });

    it('returns the tile range for one zoom level deeper', function () {
      let range;

      range = tileGrid.getTileCoordChildTileRange([0, 0, 0]);
      assert.strictEqual(range.minX, 0);
      assert.strictEqual(range.maxX, 1);
      assert.strictEqual(range.minY, 0);
      assert.strictEqual(range.maxY, 1);

      range = tileGrid.getTileCoordChildTileRange([0, 1, 0]);
      assert.strictEqual(range.minX, 2);
      assert.strictEqual(range.maxX, 3);
      assert.strictEqual(range.minY, 0);
      assert.strictEqual(range.maxY, 1);

      range = tileGrid.getTileCoordChildTileRange([0, 0, 1]);
      assert.strictEqual(range.minX, 0);
      assert.strictEqual(range.maxX, 1);
      assert.strictEqual(range.minY, 2);
      assert.strictEqual(range.maxY, 3);

      range = tileGrid.getTileCoordChildTileRange([0, -1, 0]);
      assert.strictEqual(range.minX, -2);
      assert.strictEqual(range.maxX, -1);
      assert.strictEqual(range.minY, 0);
      assert.strictEqual(range.maxY, 1);

      range = tileGrid.getTileCoordChildTileRange([0, 0, -1]);
      assert.strictEqual(range.minX, 0);
      assert.strictEqual(range.maxX, 1);
      assert.strictEqual(range.minY, -2);
      assert.strictEqual(range.maxY, -1);
    });

    it('returns null for z > maxZoom', function () {
      const max = tileGrid.maxZoom;
      const range = tileGrid.getTileCoordChildTileRange([max + 1, 0, 0]);
      assert.strictEqual(range, null);
    });
  });

  describe('#forEachTileCoordParentTileRange()', function () {
    let tileGrid;
    beforeEach(function () {
      tileGrid = createForExtent(getProjection('EPSG:3857').getExtent(), 22);
    });

    it('iterates as expected', function () {
      const tileCoord = [5, 11, 21];
      const zs = [];
      const tileRanges = [];
      tileGrid.forEachTileCoordParentTileRange(
        tileCoord,
        function (z, tileRange) {
          zs.push(z);
          tileRanges.push(
            new TileRange(
              tileRange.minX,
              tileRange.maxX,
              tileRange.minY,
              tileRange.maxY,
            ),
          );
          return false;
        },
      );

      assert.deepEqual(zs.length, 5);
      assert.deepEqual(tileRanges.length, 5);

      assert.deepEqual(zs[0], 4);
      assert.deepEqual(tileRanges[0].minX, 5);
      assert.deepEqual(tileRanges[0].maxX, 5);
      assert.deepEqual(tileRanges[0].minY, 10);
      assert.deepEqual(tileRanges[0].maxY, 10);

      assert.deepEqual(zs[1], 3);
      assert.deepEqual(tileRanges[1].minX, 2);
      assert.deepEqual(tileRanges[1].maxX, 2);
      assert.deepEqual(tileRanges[1].minY, 5);
      assert.deepEqual(tileRanges[1].maxY, 5);

      assert.deepEqual(zs[2], 2);
      assert.deepEqual(tileRanges[2].minX, 1);
      assert.deepEqual(tileRanges[2].maxX, 1);
      assert.deepEqual(tileRanges[2].minY, 2);
      assert.deepEqual(tileRanges[2].maxY, 2);

      assert.deepEqual(zs[3], 1);
      assert.deepEqual(tileRanges[3].minX, 0);
      assert.deepEqual(tileRanges[3].maxX, 0);
      assert.deepEqual(tileRanges[3].minY, 1);
      assert.deepEqual(tileRanges[3].maxY, 1);

      assert.deepEqual(zs[4], 0);
      assert.deepEqual(tileRanges[4].minX, 0);
      assert.deepEqual(tileRanges[4].maxX, 0);
      assert.deepEqual(tileRanges[4].minY, 0);
      assert.deepEqual(tileRanges[4].maxY, 0);
    });
  });

  describe('getResolution', function () {
    let tileGrid;
    beforeEach(function () {
      tileGrid = createForExtent(getProjection('EPSG:3857').getExtent(), 22);
    });

    it('returns the correct resolution at the equator', function () {
      assert.approximately(tileGrid.getResolution(0), 156543.04, 1e-2);
      assert.approximately(tileGrid.getResolution(1), 78271.52, 1e-2);
      assert.approximately(tileGrid.getResolution(2), 39135.76, 1e-2);
      assert.approximately(tileGrid.getResolution(3), 19567.88, 1e-2);
      assert.approximately(tileGrid.getResolution(4), 9783.94, 1e-2);
      assert.approximately(tileGrid.getResolution(5), 4891.97, 1e-2);
      assert.approximately(tileGrid.getResolution(6), 2445.98, 1e-2);
      assert.approximately(tileGrid.getResolution(7), 1222.99, 1e-2);
      assert.approximately(tileGrid.getResolution(8), 611.5, 1e-2);
      assert.approximately(tileGrid.getResolution(9), 305.75, 1e-2);
      assert.approximately(tileGrid.getResolution(10), 152.87, 1e-2);
      assert.approximately(tileGrid.getResolution(11), 76.44, 1e-2);
      assert.approximately(tileGrid.getResolution(12), 38.22, 1e-2);
      assert.approximately(tileGrid.getResolution(13), 19.11, 1e-2);
      assert.approximately(tileGrid.getResolution(14), 9.55, 1e-2);
      assert.approximately(tileGrid.getResolution(15), 4.78, 1e-2);
      assert.approximately(tileGrid.getResolution(16), 2.39, 1e-2);
      assert.approximately(tileGrid.getResolution(17), 1.19, 1e-2);
      assert.approximately(tileGrid.getResolution(18), 0.6, 1e-2);
      assert.approximately(tileGrid.getResolution(19), 0.3, 1e-2);
    });
  });

  describe('#getTileCoordFromCoordAndZ()', function () {
    describe('Y North, X East', function () {
      it('returns the expected TileCoord', function () {
        origin = [0, 0];
        const tileGrid = new TileGrid({
          resolutions: resolutions,
          origin: origin,
          tileSize: tileSize,
        });
        let tileCoord;

        tileCoord = tileGrid.getTileCoordForCoordAndZ([0, 0], 3);
        assert.deepEqual(tileCoord[0], 3);
        assert.deepEqual(tileCoord[1], 0);
        assert.deepEqual(tileCoord[2], 0);

        tileCoord = tileGrid.getTileCoordForCoordAndZ([0, 100000], 3);
        assert.deepEqual(tileCoord[0], 3);
        assert.deepEqual(tileCoord[1], 0);
        assert.deepEqual(tileCoord[2], -10);

        tileCoord = tileGrid.getTileCoordForCoordAndZ([100000, 0], 3);
        assert.deepEqual(tileCoord[0], 3);
        assert.deepEqual(tileCoord[1], 10);
        assert.deepEqual(tileCoord[2], 0);

        tileCoord = tileGrid.getTileCoordForCoordAndZ([100000, 100000], 3);
        assert.deepEqual(tileCoord[0], 3);
        assert.deepEqual(tileCoord[1], 10);
        assert.deepEqual(tileCoord[2], -10);
      });
    });

    describe('Y South, X East', function () {
      it('returns the expected TileCoord', function () {
        origin = [0, 100000];
        const tileGrid = new TileGrid({
          resolutions: resolutions,
          origin: origin,
          tileSize: tileSize,
        });
        let tileCoord;

        tileCoord = tileGrid.getTileCoordForCoordAndZ([0, 0], 3);
        assert.deepEqual(tileCoord[0], 3);
        assert.deepEqual(tileCoord[1], 0);
        assert.deepEqual(tileCoord[2], 10);

        tileCoord = tileGrid.getTileCoordForCoordAndZ([0, 100000], 3);
        assert.deepEqual(tileCoord[0], 3);
        assert.deepEqual(tileCoord[1], 0);
        assert.deepEqual(tileCoord[2], 0);

        tileCoord = tileGrid.getTileCoordForCoordAndZ([100000, 0], 3);
        assert.deepEqual(tileCoord[0], 3);
        assert.deepEqual(tileCoord[1], 10);
        assert.deepEqual(tileCoord[2], 10);

        tileCoord = tileGrid.getTileCoordForCoordAndZ([100000, 100000], 3);
        assert.deepEqual(tileCoord[0], 3);
        assert.deepEqual(tileCoord[1], 10);
        assert.deepEqual(tileCoord[2], 0);
      });
    });
  });

  describe('getTileCoordForCoordAndResolution', function () {
    it('returns the expected TileCoord', function () {
      const tileSize = 256;
      const tileGrid = new TileGrid({
        resolutions: [10],
        origin: origin,
        tileSize: tileSize,
      });

      let coordinate;
      let tileCoord;

      // gets the first tile at the origin
      coordinate = [0, 0];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      assert.deepEqual(tileCoord[0], 0);
      assert.deepEqual(tileCoord[1], 0);
      assert.deepEqual(tileCoord[2], 0);

      // gets one tile northwest of the origin
      coordinate = [-1280, 1280];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      assert.deepEqual(tileCoord[0], 0);
      assert.deepEqual(tileCoord[1], -1);
      assert.deepEqual(tileCoord[2], -1);

      // gets one tile northeast of the origin
      coordinate = [1280, 1280];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      assert.deepEqual(tileCoord[0], 0);
      assert.deepEqual(tileCoord[1], 0);
      assert.deepEqual(tileCoord[2], -1);

      // gets one tile southeast of the origin
      coordinate = [1280, -1280];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      assert.deepEqual(tileCoord[0], 0);
      assert.deepEqual(tileCoord[1], 0);
      assert.deepEqual(tileCoord[2], 0);

      // gets one tile southwest of the origin
      coordinate = [-1280, -1280];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      assert.deepEqual(tileCoord[0], 0);
      assert.deepEqual(tileCoord[1], -1);
      assert.deepEqual(tileCoord[2], 0);

      // gets the tile to the east when on the edge
      coordinate = [2560, -1280];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      assert.deepEqual(tileCoord[0], 0);
      assert.deepEqual(tileCoord[1], 1);
      assert.deepEqual(tileCoord[2], 0);

      // gets the tile to the south when on the edge
      coordinate = [1280, -2560];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      assert.deepEqual(tileCoord[0], 0);
      assert.deepEqual(tileCoord[1], 0);
      assert.deepEqual(tileCoord[2], 1);

      // pixels are top aligned to the origin
      coordinate = [1280, -2549.999];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      assert.deepEqual(tileCoord[0], 0);
      assert.deepEqual(tileCoord[1], 0);
      assert.deepEqual(tileCoord[2], 0);

      // pixels are left aligned to the origin
      coordinate = [2549.999, -1280];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      assert.deepEqual(tileCoord[0], 0);
      assert.deepEqual(tileCoord[1], 0);
      assert.deepEqual(tileCoord[2], 0);
    });
  });

  describe('getTileCoordForXYAndResolution_', function () {
    it('returns higher tile coord for intersections by default', function () {
      const tileGrid = new TileGrid({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize,
      });

      let tileCoord;

      // gets higher tile for edge intersection
      tileCoord = tileGrid.getTileCoordForXYAndResolution_(0, 0, 100, false);
      assert.deepEqual(tileCoord[0], 3);
      assert.deepEqual(tileCoord[1], 0);
      assert.deepEqual(tileCoord[2], 0);

      // gets higher tile for edge intersection
      tileCoord = tileGrid.getTileCoordForXYAndResolution_(
        100000,
        100000,
        100,
        false,
      );
      assert.deepEqual(tileCoord[0], 3);
      assert.deepEqual(tileCoord[1], 10);
      assert.deepEqual(tileCoord[2], -10);
    });

    it('handles alt intersection policy', function () {
      const tileGrid = new TileGrid({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize,
      });

      let tileCoord;

      // can get lower tile for edge intersection
      tileCoord = tileGrid.getTileCoordForXYAndResolution_(0, 0, 100, true);
      assert.deepEqual(tileCoord[0], 3);
      assert.deepEqual(tileCoord[1], -1);
      assert.deepEqual(tileCoord[2], -1);

      // can get lower tile for edge intersection
      tileCoord = tileGrid.getTileCoordForXYAndResolution_(
        100000,
        100000,
        100,
        true,
      );
      assert.deepEqual(tileCoord[0], 3);
      assert.deepEqual(tileCoord[1], 9);
      assert.deepEqual(tileCoord[2], -11);
    });
  });

  describe('getTileCoordCenter', function () {
    it('returns the expected center', function () {
      const tileGrid = new TileGrid({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize,
      });
      let center;

      center = tileGrid.getTileCoordCenter([0, 0, 0]);
      assert.deepEqual(center[0], 50000);
      assert.deepEqual(center[1], -50000);

      center = tileGrid.getTileCoordCenter([3, 0, 0]);
      assert.deepEqual(center[0], 5000);
      assert.deepEqual(center[1], -5000);

      center = tileGrid.getTileCoordCenter([3, 9, 9]);
      assert.deepEqual(center[0], 95000);
      assert.deepEqual(center[1], -95000);
    });
  });

  describe('getTileCoordExtent', function () {
    it('returns the expected extend', function () {
      const tileGrid = new TileGrid({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize,
      });
      let tileCoordExtent;

      tileCoordExtent = tileGrid.getTileCoordExtent([0, 0, 0]);
      assert.deepEqual(tileCoordExtent[0], 0);
      assert.deepEqual(tileCoordExtent[1], -100000);
      assert.deepEqual(tileCoordExtent[2], 100000);
      assert.deepEqual(tileCoordExtent[3], 0);

      tileCoordExtent = tileGrid.getTileCoordExtent([3, 9, 0]);
      assert.deepEqual(tileCoordExtent[0], 90000);
      assert.deepEqual(tileCoordExtent[1], -10000);
      assert.deepEqual(tileCoordExtent[2], 100000);
      assert.deepEqual(tileCoordExtent[3], 0);

      tileCoordExtent = tileGrid.getTileCoordExtent([3, 0, 9]);
      assert.deepEqual(tileCoordExtent[0], 0);
      assert.deepEqual(tileCoordExtent[1], -100000);
      assert.deepEqual(tileCoordExtent[2], 10000);
      assert.deepEqual(tileCoordExtent[3], -90000);
    });
  });

  describe('getTileRangeForExtentAndZ', function () {
    it('includes a tile even if a fraction of a pixel is covered', function () {
      const tileGrid = new TileGrid({
        resolutions: [1],
        origin: [0, 10],
        tileSize: 10,
      });

      let tileRange;

      // overlaps to the right
      tileRange = tileGrid.getTileRangeForExtentAndZ([0, 0, 10.1, 10], 0);
      assert.strictEqual(tileRange.minX, 0);
      assert.strictEqual(tileRange.maxX, 1);
      assert.strictEqual(tileRange.minY, 0);
      assert.strictEqual(tileRange.maxY, 0);

      // overlaps to the bottom
      tileRange = tileGrid.getTileRangeForExtentAndZ([0, -0.1, 10, 10], 0);
      assert.strictEqual(tileRange.minX, 0);
      assert.strictEqual(tileRange.maxX, 0);
      assert.strictEqual(tileRange.minY, 0);
      assert.strictEqual(tileRange.maxY, 1);

      // overlaps to the left
      tileRange = tileGrid.getTileRangeForExtentAndZ([-0.1, 0, 10, 10], 0);
      assert.strictEqual(tileRange.minX, -1);
      assert.strictEqual(tileRange.maxX, 0);
      assert.strictEqual(tileRange.minY, 0);
      assert.strictEqual(tileRange.maxY, 0);

      // overlaps to the top
      tileRange = tileGrid.getTileRangeForExtentAndZ([0, 0, 10, 10.1], 0);
      assert.strictEqual(tileRange.minX, 0);
      assert.strictEqual(tileRange.maxX, 0);
      assert.strictEqual(tileRange.minY, -1);
      assert.strictEqual(tileRange.maxY, 0);
    });

    it('returns the expected TileRange', function () {
      const tileGrid = new TileGrid({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize,
      });
      const e = [45000, 5000, 55000, 15000];
      let tileRange;

      tileRange = tileGrid.getTileRangeForExtentAndZ(e, 0);
      assert.deepEqual(tileRange.minY, -1);
      assert.deepEqual(tileRange.minX, 0);
      assert.deepEqual(tileRange.maxX, 0);
      assert.deepEqual(tileRange.maxY, -1);

      tileRange = tileGrid.getTileRangeForExtentAndZ(e, 1);
      assert.deepEqual(tileRange.minX, 0);
      assert.deepEqual(tileRange.minY, -1);
      assert.deepEqual(tileRange.maxX, 1);
      assert.deepEqual(tileRange.maxY, -1);

      tileRange = tileGrid.getTileRangeForExtentAndZ(e, 2);
      assert.deepEqual(tileRange.minX, 1);
      assert.deepEqual(tileRange.minY, -1);
      assert.deepEqual(tileRange.maxX, 2);
      assert.deepEqual(tileRange.maxY, -1);

      tileRange = tileGrid.getTileRangeForExtentAndZ(e, 3);
      assert.deepEqual(tileRange.minX, 4);
      assert.deepEqual(tileRange.minY, -2);
      assert.deepEqual(tileRange.maxX, 5);
      assert.deepEqual(tileRange.maxY, -1);
    });
  });

  describe('getTileSize', function () {
    const resolutions = [1000, 500, 250, 100];
    const origin = [0, 0];

    it('works with one tile size as number', function () {
      const tileGrid = new TileGrid({
        tileSize: 256,
        resolutions: resolutions,
        origin: origin,
      });
      assert.equal(tileGrid.getTileSize(0), 256);
      assert.equal(tileGrid.getTileSize(3), 256);
    });

    it('works with one tile size as array', function () {
      const tileGrid = new TileGrid({
        tileSize: [512, 256],
        resolutions: resolutions,
        origin: origin,
      });
      assert.deepEqual(tileGrid.getTileSize(0), [512, 256]);
      assert.deepEqual(tileGrid.getTileSize(3), [512, 256]);
    });

    it('works with multiple tile sizes as number', function () {
      const tileGrid = new TileGrid({
        tileSizes: [256, 256, 256, 512],
        resolutions: resolutions,
        origin: origin,
      });
      assert.equal(tileGrid.getTileSize(0), 256);
      assert.equal(tileGrid.getTileSize(3), 512);
    });

    it('works with multiple tile sizes as array', function () {
      const tileGrid = new TileGrid({
        tileSizes: [
          [512, 256],
          [512, 256],
          [512, 256],
          [640, 320],
        ],
        resolutions: resolutions,
        origin: origin,
      });
      assert.deepEqual(tileGrid.getTileSize(0), [512, 256]);
      assert.deepEqual(tileGrid.getTileSize(3), [640, 320]);
    });
  });

  describe('forEachTileCoord', function () {
    it('calls the provided function with each tile coordinate', function () {
      const tileGrid = createXYZ({extent: [-180, -90, 180, 90]});
      const tileCoords = [];
      tileGrid.forEachTileCoord([15, 47, 16, 48], 8, function (tileCoord) {
        tileCoords.push(tileCoord);
      });
      assert.deepEqual(tileCoords, [
        [8, 138, 29],
        [8, 138, 30],
        [8, 139, 29],
        [8, 139, 30],
      ]);
    });
  });

  describe('forEachTileCoordParentTileRange', function () {
    it('iterates as expected', function () {
      const tileGrid = new TileGrid({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize,
      });
      const zs = [];
      const tileRanges = [];

      tileGrid.forEachTileCoordParentTileRange(
        [3, 7, 3],
        function (z, tileRange) {
          zs.push(z);
          tileRanges.push(tileRange);
          return false;
        },
      );

      assert.deepEqual(zs.length, 3);
      assert.deepEqual(tileRanges.length, 3);

      assert.deepEqual(zs[0], 2);
      assert.deepEqual(tileRanges[0].minX, 2);
      assert.deepEqual(tileRanges[0].minY, 1);
      assert.deepEqual(tileRanges[0].maxX, 3);
      assert.deepEqual(tileRanges[0].maxY, 1);

      assert.deepEqual(zs[1], 1);
      assert.deepEqual(tileRanges[1].minX, 1);
      assert.deepEqual(tileRanges[1].minY, 0);
      assert.deepEqual(tileRanges[1].maxX, 1);
      assert.deepEqual(tileRanges[1].maxY, 0);

      assert.deepEqual(zs[2], 0);
      assert.deepEqual(tileRanges[2].minX, 0);
      assert.deepEqual(tileRanges[2].minY, 0);
      assert.deepEqual(tileRanges[2].maxX, 0);
      assert.deepEqual(tileRanges[2].maxY, 0);
    });
  });

  describe('getZForResolution (exact)', function () {
    it('returns the expected z value', function () {
      const tileGrid = new TileGrid({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize,
      });

      assert.deepEqual(tileGrid.getZForResolution(1000), 0);
      assert.deepEqual(tileGrid.getZForResolution(500), 1);
      assert.deepEqual(tileGrid.getZForResolution(250), 2);
      assert.deepEqual(tileGrid.getZForResolution(100), 3);
    });
  });

  describe('getZForResolution (approximate)', function () {
    it('returns the expected z value', function () {
      const tileGrid = new TileGrid({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize,
      });

      assert.deepEqual(tileGrid.getZForResolution(2000), 0);
      assert.deepEqual(tileGrid.getZForResolution(1000), 0);
      assert.deepEqual(tileGrid.getZForResolution(900), 0);
      assert.deepEqual(tileGrid.getZForResolution(750), 1);
      assert.deepEqual(tileGrid.getZForResolution(625), 1);
      assert.deepEqual(tileGrid.getZForResolution(500), 1);
      assert.deepEqual(tileGrid.getZForResolution(475), 1);
      assert.deepEqual(tileGrid.getZForResolution(375), 2);
      assert.deepEqual(tileGrid.getZForResolution(250), 2);
      assert.deepEqual(tileGrid.getZForResolution(200), 2);
      assert.deepEqual(tileGrid.getZForResolution(125), 3);
      assert.deepEqual(tileGrid.getZForResolution(100), 3);
      assert.deepEqual(tileGrid.getZForResolution(50), 3);
    });
  });

  describe('getZForResolution (lower)', function () {
    it('returns the expected z value', function () {
      const tileGrid = new TileGrid({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize,
      });

      assert.deepEqual(tileGrid.getZForResolution(2000, 1), 0);
      assert.deepEqual(tileGrid.getZForResolution(1000, 1), 0);
      assert.deepEqual(tileGrid.getZForResolution(900, 1), 0);
      assert.deepEqual(tileGrid.getZForResolution(750, 1), 0);
      assert.deepEqual(tileGrid.getZForResolution(625, 1), 0);
      assert.deepEqual(tileGrid.getZForResolution(500, 1), 1);
      assert.deepEqual(tileGrid.getZForResolution(475, 1), 1);
      assert.deepEqual(tileGrid.getZForResolution(375, 1), 1);
      assert.deepEqual(tileGrid.getZForResolution(250, 1), 2);
      assert.deepEqual(tileGrid.getZForResolution(200, 1), 2);
      assert.deepEqual(tileGrid.getZForResolution(125, 1), 2);
      assert.deepEqual(tileGrid.getZForResolution(100, 1), 3);
      assert.deepEqual(tileGrid.getZForResolution(50, 1), 3);
    });
  });

  describe('getZForResolution (higher)', function () {
    it('returns the expected z value', function () {
      const tileGrid = new TileGrid({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize,
      });

      assert.deepEqual(tileGrid.getZForResolution(2000, -1), 0);
      assert.deepEqual(tileGrid.getZForResolution(1000, -1), 0);
      assert.deepEqual(tileGrid.getZForResolution(900, -1), 1);
      assert.deepEqual(tileGrid.getZForResolution(750, -1), 1);
      assert.deepEqual(tileGrid.getZForResolution(625, -1), 1);
      assert.deepEqual(tileGrid.getZForResolution(500, -1), 1);
      assert.deepEqual(tileGrid.getZForResolution(475, -1), 2);
      assert.deepEqual(tileGrid.getZForResolution(375, -1), 2);
      assert.deepEqual(tileGrid.getZForResolution(250, -1), 2);
      assert.deepEqual(tileGrid.getZForResolution(200, -1), 3);
      assert.deepEqual(tileGrid.getZForResolution(125, -1), 3);
      assert.deepEqual(tileGrid.getZForResolution(100, -1), 3);
      assert.deepEqual(tileGrid.getZForResolution(50, -1), 3);
    });
  });

  describe('getZForResolution (NearestDirectionFunction)', function () {
    it('returns the expected z value', function () {
      const tileGrid = new TileGrid({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize,
      });

      assert.deepEqual(
        tileGrid.getZForResolution(626, function (value, high, low) {
          return value - (low + (high - low) * 0.25);
        }),
        0,
      );

      assert.deepEqual(
        tileGrid.getZForResolution(625, function (value, high, low) {
          return value - (low + (high - low) * 0.25);
        }),
        1,
      );

      assert.deepEqual(
        tileGrid.getZForResolution(476, function (value, high, low) {
          return value - (low + (high - low) * 0.9);
        }),
        1,
      );

      assert.deepEqual(
        tileGrid.getZForResolution(475, function (value, high, low) {
          return value - (low + (high - low) * 0.9);
        }),
        2,
      );

      assert.deepEqual(
        tileGrid.getZForResolution(201, function (value, high, low) {
          return value - (low + (high - low) * 0.666666667);
        }),
        2,
      );

      assert.deepEqual(
        tileGrid.getZForResolution(200, function (value, high, low) {
          return value - (low + (high - low) * 0.666666667);
        }),
        3,
      );

      assert.deepEqual(
        tileGrid.getZForResolution(126, function (value, high, low) {
          return value - (low + (high - low) * 0.166666667);
        }),
        2,
      );

      assert.deepEqual(
        tileGrid.getZForResolution(125, function (value, high, low) {
          return value - (low + (high - low) * 0.166666667);
        }),
        3,
      );
    });
  });

  describe('getTileRangeForTileCoordAndZ()', function () {
    const tileGrid = createForExtent(
      getProjection('EPSG:3857').getExtent(),
      22,
    );

    it('can be used to get the child tile range', function () {
      const range = tileGrid.getTileRangeForTileCoordAndZ([0, 0, 0], 1);
      assert.strictEqual(range.minX, 0);
      assert.strictEqual(range.maxX, 1);
      assert.strictEqual(range.minY, 0);
      assert.strictEqual(range.maxY, 1);
    });

    it('can be used to get the range of a deeper level', function () {
      const range = tileGrid.getTileRangeForTileCoordAndZ([0, 0, 0], 3);
      assert.strictEqual(range.minX, 0);
      assert.strictEqual(range.maxX, 7);
      assert.strictEqual(range.minY, 0);
      assert.strictEqual(range.maxY, 7);
    });

    it('can be used to get the parent tile range', function () {
      const range = tileGrid.getTileRangeForTileCoordAndZ([1, 1, 0], 0);
      assert.strictEqual(range.minX, 0);
      assert.strictEqual(range.maxX, 0);
      assert.strictEqual(range.minY, 0);
      assert.strictEqual(range.maxY, 0);
    });

    it('can be used to get the range of a shallower level', function () {
      const range = tileGrid.getTileRangeForTileCoordAndZ([3, 1, 6], 0);
      assert.strictEqual(range.minX, 0);
      assert.strictEqual(range.maxX, 0);
      assert.strictEqual(range.minY, 0);
      assert.strictEqual(range.maxY, 0);
    });

    const tileCoord = [15, 6239, 11751];
    tileGrid.forEachTileCoordParentTileRange(
      tileCoord,
      function (z, tileRange) {
        it(`works for level ${z}`, function () {
          const range = tileGrid.getTileRangeForTileCoordAndZ(tileCoord, z);
          assert.strictEqual(range.minX, tileRange.minX);
          assert.strictEqual(range.maxX, tileRange.maxX);
          assert.strictEqual(range.minY, tileRange.minY);
          assert.strictEqual(range.maxY, tileRange.maxY);
        });
      },
    );
  });
});
