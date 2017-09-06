

import _ol_ from '../../../../src/ol';
import _ol_TileRange_ from '../../../../src/ol/tilerange';
import _ol_extent_ from '../../../../src/ol/extent';
import _ol_proj_ from '../../../../src/ol/proj';
import _ol_proj_EPSG3857_ from '../../../../src/ol/proj/epsg3857';
import _ol_proj_Projection_ from '../../../../src/ol/proj/projection';
import _ol_tilegrid_ from '../../../../src/ol/tilegrid';
import _ol_tilegrid_TileGrid_ from '../../../../src/ol/tilegrid/tilegrid';


describe('ol.tilegrid.TileGrid', function() {
  var resolutions;
  var origin;
  var tileSize;

  beforeEach(function() {
    resolutions = [1000, 500, 250, 100];
    origin = [0, 0];
    tileSize = 100;
  });

  describe('create valid', function() {
    it('does not throw an exception', function() {
      expect(function() {
        return new _ol_tilegrid_TileGrid_({
          resolutions: resolutions,
          origin: origin,
          tileSize: tileSize
        });
      }).not.to.throwException();
    });
  });

  describe('create with duplicate resolutions', function() {
    it('throws an exception', function() {
      expect(function() {
        return new _ol_tilegrid_TileGrid_({
          resolutions: [100, 50, 50, 25, 10],
          origin: origin,
          tileSize: tileSize
        });
      }).to.throwException();
    });
  });

  describe('create with out of order resolutions', function() {
    it('throws an exception', function() {
      var resolutions = [100, 25, 50, 10];
      expect(function() {
        return new _ol_tilegrid_TileGrid_({
          resolutions: resolutions,
          origin: origin,
          tileSize: tileSize
        });
      }).to.throwException();
    });
  });

  describe('create with multiple origins', function() {
    it('does not throw an exception', function() {
      expect(function() {
        return new _ol_tilegrid_TileGrid_({
          resolutions: [100, 50, 25, 10],
          origins: [origin, origin, origin, origin],
          tileSize: tileSize
        });
      }).not.to.throwException();
    });
  });

  describe('create with both origin and multiple origins', function() {
    it('throws an exception', function() {
      expect(function() {
        return new _ol_tilegrid_TileGrid_({
          resolutions: [100, 50, 25, 10],
          origins: [origin, origin, origin, origin],
          origin: origin,
          tileSize: tileSize
        });
      }).to.throwException();
    });
  });

  describe('create with too few origins', function() {
    it('throws an exception', function() {
      expect(function() {
        return new _ol_tilegrid_TileGrid_({
          resolutions: [100, 50, 25, 10],
          origins: [origin, origin, origin],
          tileSize: tileSize
        });
      }).to.throwException();
    });
  });

  describe('create with too many origins', function() {
    it('throws an exception', function() {
      expect(function() {
        return new _ol_tilegrid_TileGrid_({
          resolutions: [100, 50, 25, 10],
          origins: [origin, origin, origin, origin, origin],
          tileSize: tileSize
        });
      }).to.throwException();
    });
  });

  describe('create with multiple tileSizes', function() {
    it('does not throw an exception', function() {
      expect(function() {
        return new _ol_tilegrid_TileGrid_({
          resolutions: [100, 50, 25, 10],
          tileSizes: [tileSize, tileSize, tileSize, tileSize],
          origin: origin
        });
      }).not.to.throwException();
    });
  });

  describe('create with both tileSize and multiple tileSizes', function() {
    it('throws an exception', function() {
      expect(function() {
        return new _ol_tilegrid_TileGrid_({
          resolutions: [100, 50, 25, 10],
          tileSizes: [tileSize, tileSize, tileSize, tileSize],
          tileSize: tileSize,
          origin: origin
        });
      }).to.throwException();
    });
  });

  describe('create with too few tileSizes', function() {
    it('throws an exception', function() {
      expect(function() {
        return new _ol_tilegrid_TileGrid_({
          resolutions: [100, 50, 25, 10],
          tileSizes: [tileSize, tileSize, tileSize],
          origin: origin
        });
      }).to.throwException();
    });
  });

  describe('create with too many tileSizes', function() {
    it('throws an exception', function() {
      expect(function() {
        return new _ol_tilegrid_TileGrid_({
          resolutions: [100, 50, 25, 10],
          tileSizes: [tileSize, tileSize, tileSize, tileSize, tileSize],
          origin: origin
        });
      }).to.throwException();
    });
  });

  describe('create with origin', function() {
    var tileGrid;
    beforeEach(function() {
      tileGrid = new _ol_tilegrid_TileGrid_({
        origin: [10, 20],
        tileSize: 10,
        resolutions: [1]
      });
    });

    it('returns the configured origin', function() {
      expect(tileGrid.getOrigin()).to.eql([10, 20]);
    });

    it('returns null for an unknown extent', function() {
      expect(tileGrid.getExtent()).to.equal(null);
    });

    it('returns null for an unknown full tile range', function() {
      expect(tileGrid.getFullTileRange(0)).to.equal(null);
    });
  });

  describe('create with extent', function() {
    var tileGrid;
    beforeEach(function() {
      tileGrid = new _ol_tilegrid_TileGrid_({
        extent: [10, 20, 30, 40],
        tileSize: 10,
        resolutions: [1]
      });
    });

    it('assumes top left corner of extent as origin', function() {
      expect(tileGrid.getOrigin()).to.eql([10, 40]);
    });

    it('calculates full tile ranges from extent', function() {
      var fullTileRange = tileGrid.getFullTileRange(0);
      expect(fullTileRange.minX).to.equal(0);
      expect(fullTileRange.maxX).to.equal(1);
      expect(fullTileRange.minY).to.equal(-2);
      expect(fullTileRange.maxY).to.equal(-1);
    });
  });

  describe('create with extent and sizes', function() {
    var tileGrid;
    beforeEach(function() {
      tileGrid = new _ol_tilegrid_TileGrid_({
        extent: [10, 20, 30, 40],
        sizes: [[3, -3]],
        tileSize: 10,
        resolutions: [1]
      });
    });

    it('returns the configured extent', function() {
      expect(tileGrid.getExtent()).to.eql([10, 20, 30, 40]);
    });

    it('calculates full tile ranges from sizes', function() {
      var fullTileRange = tileGrid.getFullTileRange(0);
      expect(fullTileRange.minX).to.equal(0);
      expect(fullTileRange.maxX).to.equal(2);
      expect(fullTileRange.minY).to.equal(-3);
      expect(fullTileRange.maxY).to.equal(-1);
    });
  });

  describe('create with top-left origin and sizes', function() {
    var tileGrid;
    beforeEach(function() {
      tileGrid = new _ol_tilegrid_TileGrid_({
        origin: [10, 40],
        sizes: [[3, -3]],
        tileSize: 10,
        resolutions: [1]
      });
    });

    it('calculates correct minY and maxY for negative heights', function() {
      var fullTileRange = tileGrid.getFullTileRange(0);
      expect(fullTileRange.minY).to.equal(-3);
      expect(fullTileRange.maxY).to.equal(-1);
    });
  });

  describe('create with bottom-left origin and sizes', function() {
    var tileGrid;
    beforeEach(function() {
      tileGrid = new _ol_tilegrid_TileGrid_({
        origin: [10, 10],
        sizes: [[3, 3]],
        tileSize: 10,
        resolutions: [1]
      });
    });

    it('calculates correct minX and maxX for positive heights', function() {
      var fullTileRange = tileGrid.getFullTileRange(0);
      expect(fullTileRange.minY).to.equal(0);
      expect(fullTileRange.maxY).to.equal(2);
    });
  });

  describe('create with extent and origin', function() {
    it('uses both origin and extent', function() {
      var tileGrid = new _ol_tilegrid_TileGrid_({
        origin: [0, 0],
        extent: [10, 20, 30, 40],
        tileSize: 10,
        resolutions: [1]
      });
      expect(tileGrid.getOrigin()).to.eql([0, 0]);
      expect(tileGrid.getExtent()).to.eql([10, 20, 30, 40]);
    });
  });

  describe('createForExtent', function() {
    it('allows creation of tile grid from extent', function() {
      var extent = _ol_extent_.createOrUpdate(-100, -100, 100, 100);
      var grid = _ol_tilegrid_.createForExtent(extent);
      expect(grid).to.be.a(_ol_tilegrid_TileGrid_);

      var resolutions = grid.getResolutions();
      expect(resolutions.length).to.be(_ol_.DEFAULT_MAX_ZOOM + 1);
      expect(grid.getOrigin()).to.eql([-100, 100]);
    });
  });

  describe('#zoomFactor_', function() {
    it('is set for a consistent zoom factor', function() {
      var grid = new _ol_tilegrid_TileGrid_({
        resolutions: [10, 5, 2.5, 1.25],
        origin: origin,
        tileSize: tileSize
      });
      expect(grid.zoomFactor_).to.be(2);
    });

    it('is not set for an inconsistent zoom factor', function() {
      var grid = new _ol_tilegrid_TileGrid_({
        resolutions: [10, 5, 3, 1.25],
        origin: origin,
        tileSize: tileSize
      });
      expect(grid.zoomFactor_).to.be(undefined);
    });
  });

  describe('createForProjection', function() {

    it('allows easier creation of a tile grid', function() {
      var projection = _ol_proj_.get('EPSG:3857');
      var grid = _ol_tilegrid_.createForProjection(projection);
      expect(grid).to.be.a(_ol_tilegrid_TileGrid_);

      var resolutions = grid.getResolutions();
      expect(resolutions.length).to.be(_ol_.DEFAULT_MAX_ZOOM + 1);
    });

    it('accepts a number of zoom levels', function() {
      var projection = _ol_proj_.get('EPSG:3857');
      var grid = _ol_tilegrid_.createForProjection(projection, 18);
      expect(grid).to.be.a(_ol_tilegrid_TileGrid_);

      var resolutions = grid.getResolutions();
      expect(resolutions.length).to.be(19);
    });

    it('accepts a big number of zoom levels', function() {
      var projection = _ol_proj_.get('EPSG:3857');
      var grid = _ol_tilegrid_.createForProjection(projection, 23);
      expect(grid).to.be.a(_ol_tilegrid_TileGrid_);

      var resolutions = grid.getResolutions();
      expect(resolutions.length).to.be(24);
    });

    it('works for projections unknown to the client', function() {
      var projection = new _ol_proj_Projection_(
          {code: 'EPSG:31287', units: 'm'});
      var grid = _ol_tilegrid_.createForProjection(projection);
      var resolutions = grid.getResolutions();
      expect(resolutions[5]).to.be(
          360 * _ol_proj_.METERS_PER_UNIT['degrees'] /
          _ol_.DEFAULT_TILE_SIZE / Math.pow(2, 5));
    });

    it('assumes origin is top-left', function() {
      var projection = _ol_proj_.get('EPSG:3857');
      var grid = _ol_tilegrid_.createForProjection(projection);
      var origin = grid.getOrigin();
      var half = _ol_proj_EPSG3857_.HALF_SIZE;
      expect(origin).to.eql([-half, half]);
    });

    it('accepts bottom-left as corner', function() {
      var projection = _ol_proj_.get('EPSG:3857');
      var grid = _ol_tilegrid_.createForProjection(
          projection, undefined, undefined, 'bottom-left');
      var origin = grid.getOrigin();
      var half = _ol_proj_EPSG3857_.HALF_SIZE;
      expect(origin).to.eql([-half, -half]);
    });

    it('accepts bottom-right as corner', function() {
      var projection = _ol_proj_.get('EPSG:3857');
      var grid = _ol_tilegrid_.createForProjection(
          projection, undefined, undefined, 'bottom-right');
      var origin = grid.getOrigin();
      var half = _ol_proj_EPSG3857_.HALF_SIZE;
      expect(origin).to.eql([half, -half]);
    });

    it('accepts top-left as corner', function() {
      var projection = _ol_proj_.get('EPSG:3857');
      var grid = _ol_tilegrid_.createForProjection(
          projection, undefined, undefined, 'top-left');
      var origin = grid.getOrigin();
      var half = _ol_proj_EPSG3857_.HALF_SIZE;
      expect(origin).to.eql([-half, half]);
    });

    it('accepts top-right as corner', function() {
      var projection = _ol_proj_.get('EPSG:3857');
      var grid = _ol_tilegrid_.createForProjection(
          projection, undefined, undefined, 'top-right');
      var origin = grid.getOrigin();
      var half = _ol_proj_EPSG3857_.HALF_SIZE;
      expect(origin).to.eql([half, half]);
    });

  });

  describe('createXYZ()', function() {

    it('uses defaults', function() {
      var tileGrid = _ol_tilegrid_.createXYZ();
      expect(tileGrid.getExtent()).to.eql(
          _ol_proj_.get('EPSG:3857').getExtent());
      expect(tileGrid.getMinZoom()).to.equal(0);
      expect(tileGrid.getMaxZoom()).to.equal(_ol_.DEFAULT_MAX_ZOOM);
      expect(tileGrid.getTileSize()).to.equal(_ol_.DEFAULT_TILE_SIZE);
    });

    it('respects configuration options', function() {
      var tileGrid = _ol_tilegrid_.createXYZ({
        extent: [10, 20, 30, 40],
        minZoom: 1,
        maxZoom: 2,
        tileSize: 128
      });
      expect(tileGrid.getExtent()).to.eql([10, 20, 30, 40]);
      expect(tileGrid.getMinZoom()).to.equal(1);
      expect(tileGrid.getMaxZoom()).to.equal(2);
      expect(tileGrid.getTileSize()).to.equal(128);
    });

  });

  describe('getForProjection', function() {

    it('gets the default tile grid for a projection', function() {
      var projection = _ol_proj_.get('EPSG:3857');
      var grid = _ol_tilegrid_.getForProjection(projection);
      expect(grid).to.be.a(_ol_tilegrid_TileGrid_);

      var resolutions = grid.getResolutions();
      expect(resolutions.length).to.be(_ol_.DEFAULT_MAX_ZOOM + 1);
      expect(grid.getTileSize()).to.eql(256);
    });

    it('stores the default tile grid on a projection', function() {
      var projection = _ol_proj_.get('EPSG:3857');
      var grid = _ol_tilegrid_.getForProjection(projection);
      var gridAgain = _ol_tilegrid_.getForProjection(projection);

      expect(grid).to.be(gridAgain);
    });

  });

  describe('#getTileCoordChildTileRange()', function() {

    var tileGrid;
    beforeEach(function() {
      tileGrid = _ol_tilegrid_.createForExtent(
          _ol_proj_.get('EPSG:3857').getExtent(), 22);
    });

    it('returns the tile range for one zoom level deeper', function() {
      var range;

      range = tileGrid.getTileCoordChildTileRange([0, 0, 0]);
      expect(range.minX).to.be(0);
      expect(range.maxX).to.be(1);
      expect(range.minY).to.be(0);
      expect(range.maxY).to.be(1);

      range = tileGrid.getTileCoordChildTileRange([0, 1, 0]);
      expect(range.minX).to.be(2);
      expect(range.maxX).to.be(3);
      expect(range.minY).to.be(0);
      expect(range.maxY).to.be(1);

      range = tileGrid.getTileCoordChildTileRange([0, 0, 1]);
      expect(range.minX).to.be(0);
      expect(range.maxX).to.be(1);
      expect(range.minY).to.be(2);
      expect(range.maxY).to.be(3);

      range = tileGrid.getTileCoordChildTileRange([0, -1, 0]);
      expect(range.minX).to.be(-2);
      expect(range.maxX).to.be(-1);
      expect(range.minY).to.be(0);
      expect(range.maxY).to.be(1);

      range = tileGrid.getTileCoordChildTileRange([0, 0, -1]);
      expect(range.minX).to.be(0);
      expect(range.maxX).to.be(1);
      expect(range.minY).to.be(-2);
      expect(range.maxY).to.be(-1);
    });

    it('returns null for z > maxZoom', function() {
      var max = tileGrid.maxZoom;
      var range = tileGrid.getTileCoordChildTileRange([max + 1, 0, 0]);
      expect(range).to.be(null);
    });

  });

  describe('#forEachTileCoordParentTileRange()', function() {

    var tileGrid;
    beforeEach(function() {
      tileGrid = _ol_tilegrid_.createForExtent(
          _ol_proj_.get('EPSG:3857').getExtent(), 22);
    });

    it('iterates as expected', function() {

      var tileCoord = [5, 11, 21];
      var zs = [], tileRanges = [];
      tileGrid.forEachTileCoordParentTileRange(
          tileCoord,
          function(z, tileRange) {
            zs.push(z);
            tileRanges.push(new _ol_TileRange_(
                tileRange.minX, tileRange.maxX,
                tileRange.minY, tileRange.maxY));
            return false;
          });

      expect(zs.length).to.eql(5);
      expect(tileRanges.length).to.eql(5);

      expect(zs[0]).to.eql(4);
      expect(tileRanges[0].minX).to.eql(5);
      expect(tileRanges[0].maxX).to.eql(5);
      expect(tileRanges[0].minY).to.eql(10);
      expect(tileRanges[0].maxY).to.eql(10);

      expect(zs[1]).to.eql(3);
      expect(tileRanges[1].minX).to.eql(2);
      expect(tileRanges[1].maxX).to.eql(2);
      expect(tileRanges[1].minY).to.eql(5);
      expect(tileRanges[1].maxY).to.eql(5);

      expect(zs[2]).to.eql(2);
      expect(tileRanges[2].minX).to.eql(1);
      expect(tileRanges[2].maxX).to.eql(1);
      expect(tileRanges[2].minY).to.eql(2);
      expect(tileRanges[2].maxY).to.eql(2);

      expect(zs[3]).to.eql(1);
      expect(tileRanges[3].minX).to.eql(0);
      expect(tileRanges[3].maxX).to.eql(0);
      expect(tileRanges[3].minY).to.eql(1);
      expect(tileRanges[3].maxY).to.eql(1);

      expect(zs[4]).to.eql(0);
      expect(tileRanges[4].minX).to.eql(0);
      expect(tileRanges[4].maxX).to.eql(0);
      expect(tileRanges[4].minY).to.eql(0);
      expect(tileRanges[4].maxY).to.eql(0);

    });

  });

  describe('getResolution', function() {

    var tileGrid;
    beforeEach(function() {
      tileGrid = _ol_tilegrid_.createForExtent(
          _ol_proj_.get('EPSG:3857').getExtent(), 22);
    });

    it('returns the correct resolution at the equator', function() {
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

  describe('#getTileCoordFromCoordAndZ()', function() {

    describe('Y North, X East', function() {
      it('returns the expected TileCoord', function() {
        origin = [0, 0];
        var tileGrid = new _ol_tilegrid_TileGrid_({
          resolutions: resolutions,
          origin: origin,
          tileSize: tileSize
        });
        var tileCoord;

        tileCoord = tileGrid.getTileCoordForCoordAndZ([0, 0], 3);
        expect(tileCoord[0]).to.eql(3);
        expect(tileCoord[1]).to.eql(0);
        expect(tileCoord[2]).to.eql(0);

        tileCoord = tileGrid.getTileCoordForCoordAndZ([0, 100000], 3);
        expect(tileCoord[0]).to.eql(3);
        expect(tileCoord[1]).to.eql(0);
        expect(tileCoord[2]).to.eql(10);

        tileCoord = tileGrid.getTileCoordForCoordAndZ([100000, 0], 3);
        expect(tileCoord[0]).to.eql(3);
        expect(tileCoord[1]).to.eql(10);
        expect(tileCoord[2]).to.eql(0);

        tileCoord = tileGrid.getTileCoordForCoordAndZ([100000, 100000], 3);
        expect(tileCoord[0]).to.eql(3);
        expect(tileCoord[1]).to.eql(10);
        expect(tileCoord[2]).to.eql(10);
      });
    });

    describe('Y South, X East', function() {
      it('returns the expected TileCoord', function() {
        origin = [0, 100000];
        var tileGrid = new _ol_tilegrid_TileGrid_({
          resolutions: resolutions,
          origin: origin,
          tileSize: tileSize
        });
        var tileCoord;

        tileCoord = tileGrid.getTileCoordForCoordAndZ([0, 0], 3);
        expect(tileCoord[0]).to.eql(3);
        expect(tileCoord[1]).to.eql(0);
        expect(tileCoord[2]).to.eql(-10);

        tileCoord = tileGrid.getTileCoordForCoordAndZ([0, 100000], 3);
        expect(tileCoord[0]).to.eql(3);
        expect(tileCoord[1]).to.eql(0);
        expect(tileCoord[2]).to.eql(0);

        tileCoord = tileGrid.getTileCoordForCoordAndZ([100000, 0], 3);
        expect(tileCoord[0]).to.eql(3);
        expect(tileCoord[1]).to.eql(10);
        expect(tileCoord[2]).to.eql(-10);

        tileCoord = tileGrid.getTileCoordForCoordAndZ([100000, 100000], 3);
        expect(tileCoord[0]).to.eql(3);
        expect(tileCoord[1]).to.eql(10);
        expect(tileCoord[2]).to.eql(0);
      });
    });
  });

  describe('getTileCoordForCoordAndResolution', function() {
    it('returns the expected TileCoord', function() {
      var tileSize = 256;
      var tileGrid = new _ol_tilegrid_TileGrid_({
        resolutions: [10],
        origin: origin,
        tileSize: tileSize
      });

      var coordinate;
      var tileCoord;

      // gets the first tile at the origin
      coordinate = [0, 0];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      expect(tileCoord[0]).to.eql(0);
      expect(tileCoord[1]).to.eql(0);
      expect(tileCoord[2]).to.eql(0);

      // gets one tile northwest of the origin
      coordinate = [-1280, 1280];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      expect(tileCoord[0]).to.eql(0);
      expect(tileCoord[1]).to.eql(-1);
      expect(tileCoord[2]).to.eql(0);

      // gets one tile northeast of the origin
      coordinate = [1280, 1280];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      expect(tileCoord[0]).to.eql(0);
      expect(tileCoord[1]).to.eql(0);
      expect(tileCoord[2]).to.eql(0);

      // gets one tile southeast of the origin
      coordinate = [1280, -1280];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      expect(tileCoord[0]).to.eql(0);
      expect(tileCoord[1]).to.eql(0);
      expect(tileCoord[2]).to.eql(-1);

      // gets one tile southwest of the origin
      coordinate = [-1280, -1280];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      expect(tileCoord[0]).to.eql(0);
      expect(tileCoord[1]).to.eql(-1);
      expect(tileCoord[2]).to.eql(-1);

      // gets the tile to the east when on the edge
      coordinate = [2560, -1280];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      expect(tileCoord[0]).to.eql(0);
      expect(tileCoord[1]).to.eql(1);
      expect(tileCoord[2]).to.eql(-1);

      // gets the tile to the north when on the edge
      coordinate = [1280, -2560];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      expect(tileCoord[0]).to.eql(0);
      expect(tileCoord[1]).to.eql(0);
      expect(tileCoord[2]).to.eql(-1);

      // pixels are top aligned to the origin
      coordinate = [1280, -2559.999];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      expect(tileCoord[0]).to.eql(0);
      expect(tileCoord[1]).to.eql(0);
      expect(tileCoord[2]).to.eql(-1);

      // pixels are left aligned to the origin
      coordinate = [2559.999, -1280];
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, 10);
      expect(tileCoord[0]).to.eql(0);
      expect(tileCoord[1]).to.eql(0);
      expect(tileCoord[2]).to.eql(-1);
    });
  });


  describe('getTileCoordForXYAndResolution_', function() {
    it('returns higher tile coord for intersections by default', function() {
      var tileGrid = new _ol_tilegrid_TileGrid_({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize
      });

      var tileCoord;

      // gets higher tile for edge intersection
      tileCoord = tileGrid.getTileCoordForXYAndResolution_(
          0, 0, 100, false);
      expect(tileCoord[0]).to.eql(3);
      expect(tileCoord[1]).to.eql(0);
      expect(tileCoord[2]).to.eql(0);

      // gets higher tile for edge intersection
      tileCoord = tileGrid.getTileCoordForXYAndResolution_(
          100000, 100000, 100, false);
      expect(tileCoord[0]).to.eql(3);
      expect(tileCoord[1]).to.eql(10);
      expect(tileCoord[2]).to.eql(10);

    });

    it('handles alt intersection policy', function() {
      var tileGrid = new _ol_tilegrid_TileGrid_({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize
      });

      var tileCoord;

      // can get lower tile for edge intersection
      tileCoord = tileGrid.getTileCoordForXYAndResolution_(
          0, 0, 100, true);
      expect(tileCoord[0]).to.eql(3);
      expect(tileCoord[1]).to.eql(-1);
      expect(tileCoord[2]).to.eql(-1);

      // gets higher tile for edge intersection
      tileCoord = tileGrid.getTileCoordForXYAndResolution_(
          100000, 100000, 100, true);
      expect(tileCoord[0]).to.eql(3);
      expect(tileCoord[1]).to.eql(9);
      expect(tileCoord[2]).to.eql(9);

    });

  });

  describe('getTileCoordCenter', function() {
    it('returns the expected center', function() {
      var tileGrid = new _ol_tilegrid_TileGrid_({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize
      });
      var center;

      center = tileGrid.getTileCoordCenter([0, 0, 0]);
      expect(center[0]).to.eql(50000);
      expect(center[1]).to.eql(50000);

      center = tileGrid.getTileCoordCenter([3, 0, 0]);
      expect(center[0]).to.eql(5000);
      expect(center[1]).to.eql(5000);

      center = tileGrid.getTileCoordCenter([3, 9, 9]);
      expect(center[0]).to.eql(95000);
      expect(center[1]).to.eql(95000);
    });
  });

  describe('getTileCoordExtent', function() {
    it('returns the expected extend', function() {
      var tileGrid = new _ol_tilegrid_TileGrid_({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize
      });
      var tileCoordExtent;

      tileCoordExtent = tileGrid.getTileCoordExtent([0, 0, 0]);
      expect(tileCoordExtent[0]).to.eql(0);
      expect(tileCoordExtent[1]).to.eql(0);
      expect(tileCoordExtent[2]).to.eql(100000);
      expect(tileCoordExtent[3]).to.eql(100000);

      tileCoordExtent = tileGrid.getTileCoordExtent([3, 9, 0]);
      expect(tileCoordExtent[0]).to.eql(90000);
      expect(tileCoordExtent[1]).to.eql(0);
      expect(tileCoordExtent[2]).to.eql(100000);
      expect(tileCoordExtent[3]).to.eql(10000);

      tileCoordExtent = tileGrid.getTileCoordExtent([3, 0, 9]);
      expect(tileCoordExtent[0]).to.eql(0);
      expect(tileCoordExtent[1]).to.eql(90000);
      expect(tileCoordExtent[2]).to.eql(10000);
      expect(tileCoordExtent[3]).to.eql(100000);
    });
  });

  describe('getTileRangeForExtentAndZ', function() {
    it('returns the expected TileRange', function() {
      var tileGrid = new _ol_tilegrid_TileGrid_({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize
      });
      var e = [45000, 5000, 55000, 15000];
      var tileRange;

      tileRange = tileGrid.getTileRangeForExtentAndZ(e, 0);
      expect(tileRange.minY).to.eql(0);
      expect(tileRange.minX).to.eql(0);
      expect(tileRange.maxX).to.eql(0);
      expect(tileRange.maxY).to.eql(0);

      tileRange = tileGrid.getTileRangeForExtentAndZ(e, 1);
      expect(tileRange.minX).to.eql(0);
      expect(tileRange.minY).to.eql(0);
      expect(tileRange.maxX).to.eql(1);
      expect(tileRange.maxY).to.eql(0);

      tileRange = tileGrid.getTileRangeForExtentAndZ(e, 2);
      expect(tileRange.minX).to.eql(1);
      expect(tileRange.minY).to.eql(0);
      expect(tileRange.maxX).to.eql(2);
      expect(tileRange.maxY).to.eql(0);

      tileRange = tileGrid.getTileRangeForExtentAndZ(e, 3);
      expect(tileRange.minX).to.eql(4);
      expect(tileRange.minY).to.eql(0);
      expect(tileRange.maxX).to.eql(5);
      expect(tileRange.maxY).to.eql(1);
    });
  });

  describe('getTileSize', function() {

    var resolutions = [1000, 500, 250, 100];
    var origin = [0, 0];

    it('works with one tile size as number', function() {
      var tileGrid = new _ol_tilegrid_TileGrid_({
        tileSize: 256,
        resolutions: resolutions,
        origin: origin
      });
      expect(tileGrid.getTileSize(0)).to.equal(256);
      expect(tileGrid.getTileSize(3)).to.equal(256);
    });

    it('works with one tile size as array', function() {
      var tileGrid = new _ol_tilegrid_TileGrid_({
        tileSize: [512, 256],
        resolutions: resolutions,
        origin: origin
      });
      expect(tileGrid.getTileSize(0)).to.eql([512, 256]);
      expect(tileGrid.getTileSize(3)).to.eql([512, 256]);
    });

    it('works with multiple tile sizes as number', function() {
      var tileGrid = new _ol_tilegrid_TileGrid_({
        tileSizes: [256, 256, 256, 512],
        resolutions: resolutions,
        origin: origin
      });
      expect(tileGrid.getTileSize(0)).to.equal(256);
      expect(tileGrid.getTileSize(3)).to.equal(512);
    });

    it('works with multiple tile sizes as array', function() {
      var tileGrid = new _ol_tilegrid_TileGrid_({
        tileSizes: [[512, 256], [512, 256], [512, 256], [640, 320]],
        resolutions: resolutions,
        origin: origin
      });
      expect(tileGrid.getTileSize(0)).to.eql([512, 256]);
      expect(tileGrid.getTileSize(3)).to.eql([640, 320]);
    });

  });

  describe('forEachTileCoord', function() {
    it('calls the provided function with each tile coordinate', function() {
      var tileGrid = _ol_tilegrid_.createXYZ({extent: [-180, -90, 180, 90]});
      var tileCoords = [];
      tileGrid.forEachTileCoord([15, 47, 16, 48], 8, function(tileCoord) {
        tileCoords.push(tileCoord);
      });
      expect(tileCoords).to.eql([
        [8, 138, -31],
        [8, 138, -30],
        [8, 139, -31],
        [8, 139, -30]
      ]);
    });
  });

  describe('forEachTileCoordParentTileRange', function() {
    it('iterates as expected', function() {
      var tileGrid = new _ol_tilegrid_TileGrid_({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize
      });
      var zs = [], tileRanges = [];

      tileGrid.forEachTileCoordParentTileRange(
          [3, 7, 3],
          function(z, tileRange) {
            zs.push(z);
            tileRanges.push(tileRange);
            return false;
          });

      expect(zs.length).to.eql(3);
      expect(tileRanges.length).to.eql(3);

      expect(zs[0]).to.eql(2);
      expect(tileRanges[0].minX).to.eql(2);
      expect(tileRanges[0].minY).to.eql(1);
      expect(tileRanges[0].maxX).to.eql(3);
      expect(tileRanges[0].maxY).to.eql(1);

      expect(zs[1]).to.eql(1);
      expect(tileRanges[1].minX).to.eql(1);
      expect(tileRanges[1].minY).to.eql(0);
      expect(tileRanges[1].maxX).to.eql(1);
      expect(tileRanges[1].maxY).to.eql(0);

      expect(zs[2]).to.eql(0);
      expect(tileRanges[2].minX).to.eql(0);
      expect(tileRanges[2].minY).to.eql(0);
      expect(tileRanges[2].maxX).to.eql(0);
      expect(tileRanges[2].maxY).to.eql(0);
    });
  });

  describe('getZForResolution (exact)', function() {
    it('returns the expected z value', function() {
      var tileGrid = new _ol_tilegrid_TileGrid_({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize
      });

      expect(tileGrid.getZForResolution(1000)).to.eql(0);
      expect(tileGrid.getZForResolution(500)).to.eql(1);
      expect(tileGrid.getZForResolution(250)).to.eql(2);
      expect(tileGrid.getZForResolution(100)).to.eql(3);
    });
  });

  describe('getZForResolution (approximate)', function() {
    it('returns the expected z value', function() {
      var tileGrid = new _ol_tilegrid_TileGrid_({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize
      });

      expect(tileGrid.getZForResolution(2000)).to.eql(0);
      expect(tileGrid.getZForResolution(1000)).to.eql(0);
      expect(tileGrid.getZForResolution(900)).to.eql(0);
      expect(tileGrid.getZForResolution(750)).to.eql(1);
      expect(tileGrid.getZForResolution(625)).to.eql(1);
      expect(tileGrid.getZForResolution(500)).to.eql(1);
      expect(tileGrid.getZForResolution(475)).to.eql(1);
      expect(tileGrid.getZForResolution(375)).to.eql(2);
      expect(tileGrid.getZForResolution(250)).to.eql(2);
      expect(tileGrid.getZForResolution(200)).to.eql(2);
      expect(tileGrid.getZForResolution(125)).to.eql(3);
      expect(tileGrid.getZForResolution(100)).to.eql(3);
      expect(tileGrid.getZForResolution(50)).to.eql(3);
    });
  });

  describe('getZForResolution (lower)', function() {
    it('returns the expected z value', function() {
      var tileGrid = new _ol_tilegrid_TileGrid_({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize
      });

      expect(tileGrid.getZForResolution(2000, 1)).to.eql(0);
      expect(tileGrid.getZForResolution(1000, 1)).to.eql(0);
      expect(tileGrid.getZForResolution(900, 1)).to.eql(0);
      expect(tileGrid.getZForResolution(750, 1)).to.eql(0);
      expect(tileGrid.getZForResolution(625, 1)).to.eql(0);
      expect(tileGrid.getZForResolution(500, 1)).to.eql(1);
      expect(tileGrid.getZForResolution(475, 1)).to.eql(1);
      expect(tileGrid.getZForResolution(375, 1)).to.eql(1);
      expect(tileGrid.getZForResolution(250, 1)).to.eql(2);
      expect(tileGrid.getZForResolution(200, 1)).to.eql(2);
      expect(tileGrid.getZForResolution(125, 1)).to.eql(2);
      expect(tileGrid.getZForResolution(100, 1)).to.eql(3);
      expect(tileGrid.getZForResolution(50, 1)).to.eql(3);
    });
  });

  describe('getZForResolution (higher)', function() {
    it('returns the expected z value', function() {
      var tileGrid = new _ol_tilegrid_TileGrid_({
        resolutions: resolutions,
        origin: origin,
        tileSize: tileSize
      });

      expect(tileGrid.getZForResolution(2000, -1)).to.eql(0);
      expect(tileGrid.getZForResolution(1000, -1)).to.eql(0);
      expect(tileGrid.getZForResolution(900, -1)).to.eql(1);
      expect(tileGrid.getZForResolution(750, -1)).to.eql(1);
      expect(tileGrid.getZForResolution(625, -1)).to.eql(1);
      expect(tileGrid.getZForResolution(500, -1)).to.eql(1);
      expect(tileGrid.getZForResolution(475, -1)).to.eql(2);
      expect(tileGrid.getZForResolution(375, -1)).to.eql(2);
      expect(tileGrid.getZForResolution(250, -1)).to.eql(2);
      expect(tileGrid.getZForResolution(200, -1)).to.eql(3);
      expect(tileGrid.getZForResolution(125, -1)).to.eql(3);
      expect(tileGrid.getZForResolution(100, -1)).to.eql(3);
      expect(tileGrid.getZForResolution(50, -1)).to.eql(3);
    });
  });
});
