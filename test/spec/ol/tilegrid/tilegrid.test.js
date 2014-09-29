goog.provide('ol.test.TileGrid');

describe('ol.tilegrid.TileGrid', function() {
  var extent;
  var resolutions;
  var origin;
  var origins;
  var tileSize;

  beforeEach(function() {
    resolutions = [1000, 500, 250, 100];
    extent = [0, 0, 100000, 100000];
    origin = [0, 0];
    origins = [];
    tileSize = 100;
  });

  describe('create valid', function() {
    it('does not throw an exception', function() {
      expect(function() {
        return new ol.tilegrid.TileGrid({
          resolutions: resolutions,
          extent: extent,
          origin: origin,
          tileSize: tileSize
        });
      }).not.to.throwException();
    });
  });

  describe('create with duplicate resolutions', function() {
    it('throws an exception', function() {
      expect(function() {
        return new ol.tilegrid.TileGrid({
          resolutions: [100, 50, 50, 25, 10],
          extent: extent,
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
        return new ol.tilegrid.TileGrid({
          resolutions: resolutions,
          extent: extent,
          origin: origin,
          tileSize: tileSize
        });
      }).to.throwException();
    });
  });

  describe('create with multiple origins', function() {
    it('does not throw an exception', function() {
      expect(function() {
        return new ol.tilegrid.TileGrid({
          resolutions: [100, 50, 25, 10],
          extent: extent,
          origins: [origin, origin, origin, origin],
          tileSize: tileSize
        });
      }).not.to.throwException();
    });
  });

  describe('create with both origin and multiple origins', function() {
    it('throws an exception', function() {
      expect(function() {
        return new ol.tilegrid.TileGrid({
          resolutions: [100, 50, 25, 10],
          extent: extent,
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
        return new ol.tilegrid.TileGrid({
          resolutions: [100, 50, 25, 10],
          extent: extent,
          origins: [origin, origin, origin],
          tileSize: tileSize
        });
      }).to.throwException();
    });
  });

  describe('create with too many origins', function() {
    it('throws an exception', function() {
      expect(function() {
        return new ol.tilegrid.TileGrid({
          resolutions: [100, 50, 25, 10],
          extent: extent,
          origins: [origin, origin, origin, origin, origin],
          tileSize: tileSize
        });
      }).to.throwException();
    });
  });

  describe('create with multiple tileSizes', function() {
    it('does not throw an exception', function() {
      expect(function() {
        return new ol.tilegrid.TileGrid({
          resolutions: [100, 50, 25, 10],
          extent: extent,
          tileSizes: [tileSize, tileSize, tileSize, tileSize],
          origin: origin
        });
      }).not.to.throwException();
    });
  });

  describe('create with both tileSize and multiple tileSizes', function() {
    it('throws an exception', function() {
      expect(function() {
        return new ol.tilegrid.TileGrid({
          resolutions: [100, 50, 25, 10],
          extent: extent,
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
        return new ol.tilegrid.TileGrid({
          resolutions: [100, 50, 25, 10],
          extent: extent,
          tileSizes: [tileSize, tileSize, tileSize],
          origin: origin
        });
      }).to.throwException();
    });
  });

  describe('create with too many tileSizes', function() {
    it('throws an exception', function() {
      expect(function() {
        return new ol.tilegrid.TileGrid({
          resolutions: [100, 50, 25, 10],
          extent: extent,
          tileSizes: [tileSize, tileSize, tileSize, tileSize, tileSize],
          origin: origin
        });
      }).to.throwException();
    });
  });

  describe('createForExtent', function() {
    it('allows creation of tile grid from extent', function() {
      var extent = ol.extent.createOrUpdate(-100, -100, 100, 100);
      var grid = ol.tilegrid.createForExtent(extent);
      expect(grid).to.be.a(ol.tilegrid.TileGrid);

      var resolutions = grid.getResolutions();
      expect(resolutions.length).to.be(ol.DEFAULT_MAX_ZOOM + 1);
      expect(grid.getOrigin()).to.eql([-100, -100]);
    });
  });

  describe('createForProjection', function() {

    it('allows easier creation of a tile grid', function() {
      var projection = ol.proj.get('EPSG:3857');
      var grid = ol.tilegrid.createForProjection(projection);
      expect(grid).to.be.a(ol.tilegrid.TileGrid);

      var resolutions = grid.getResolutions();
      expect(resolutions.length).to.be(ol.DEFAULT_MAX_ZOOM + 1);
    });

    it('accepts a number of zoom levels', function() {
      var projection = ol.proj.get('EPSG:3857');
      var grid = ol.tilegrid.createForProjection(projection, 18);
      expect(grid).to.be.a(ol.tilegrid.TileGrid);

      var resolutions = grid.getResolutions();
      expect(resolutions.length).to.be(19);
    });

    it('accepts a big number of zoom levels', function() {
      var projection = ol.proj.get('EPSG:3857');
      var grid = ol.tilegrid.createForProjection(projection, 23);
      expect(grid).to.be.a(ol.tilegrid.TileGrid);

      var resolutions = grid.getResolutions();
      expect(resolutions.length).to.be(24);
    });

    it('works for projections unknown to the client', function() {
      var projection = new ol.proj.Projection(
          {code: 'EPSG:31287', units: 'm'});
      var grid = ol.tilegrid.createForProjection(projection);
      var resolutions = grid.getResolutions();
      expect(resolutions[5]).to.be(
          360 * ol.proj.METERS_PER_UNIT[ol.proj.Units.DEGREES] /
          ol.DEFAULT_TILE_SIZE / Math.pow(2, 5));
    });

    it('assumes origin is bottom-left', function() {
      var projection = ol.proj.get('EPSG:3857');
      var grid = ol.tilegrid.createForProjection(projection);
      var origin = grid.getOrigin();
      var half = ol.proj.EPSG3857.HALF_SIZE;
      expect(origin).to.eql([-half, -half]);
    });

    it('accepts bottom-left as corner', function() {
      var projection = ol.proj.get('EPSG:3857');
      var grid = ol.tilegrid.createForProjection(
          projection, undefined, undefined, ol.extent.Corner.BOTTOM_LEFT);
      var origin = grid.getOrigin();
      var half = ol.proj.EPSG3857.HALF_SIZE;
      expect(origin).to.eql([-half, -half]);
    });

    it('accepts bottom-right as corner', function() {
      var projection = ol.proj.get('EPSG:3857');
      var grid = ol.tilegrid.createForProjection(
          projection, undefined, undefined, ol.extent.Corner.BOTTOM_RIGHT);
      var origin = grid.getOrigin();
      var half = ol.proj.EPSG3857.HALF_SIZE;
      expect(origin).to.eql([half, -half]);
    });

    it('accepts top-left as corner', function() {
      var projection = ol.proj.get('EPSG:3857');
      var grid = ol.tilegrid.createForProjection(
          projection, undefined, undefined, ol.extent.Corner.TOP_LEFT);
      var origin = grid.getOrigin();
      var half = ol.proj.EPSG3857.HALF_SIZE;
      expect(origin).to.eql([-half, half]);
    });

    it('accepts top-right as corner', function() {
      var projection = ol.proj.get('EPSG:3857');
      var grid = ol.tilegrid.createForProjection(
          projection, undefined, undefined, ol.extent.Corner.TOP_RIGHT);
      var origin = grid.getOrigin();
      var half = ol.proj.EPSG3857.HALF_SIZE;
      expect(origin).to.eql([half, half]);
    });

  });

  describe('getForProjection', function() {

    it('gets the default tile grid for a projection', function() {
      var projection = ol.proj.get('EPSG:3857');
      var grid = ol.tilegrid.getForProjection(projection);
      expect(grid).to.be.a(ol.tilegrid.TileGrid);

      var resolutions = grid.getResolutions();
      expect(resolutions.length).to.be(ol.DEFAULT_MAX_ZOOM + 1);
      expect(grid.getTileSize()).to.eql(256);
    });

    it('stores the default tile grid on a projection', function() {
      var projection = ol.proj.get('EPSG:3857');
      var grid = ol.tilegrid.getForProjection(projection);
      var gridAgain = ol.tilegrid.getForProjection(projection);

      expect(grid).to.be(gridAgain);
    });

  });

  describe('getTileCoordFromCoordAndZ', function() {

    describe('Y North, X East', function() {
      it('returns the expected TileCoord', function() {
        origin = [0, 0];
        var tileGrid = new ol.tilegrid.TileGrid({
          resolutions: resolutions,
          extent: extent,
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
        var tileGrid = new ol.tilegrid.TileGrid({
          resolutions: resolutions,
          extent: extent,
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
      var tileGrid = new ol.tilegrid.TileGrid({
        resolutions: [10],
        extent: extent,
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
      var tileGrid = new ol.tilegrid.TileGrid({
        resolutions: resolutions,
        extent: extent,
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
      var tileGrid = new ol.tilegrid.TileGrid({
        resolutions: resolutions,
        extent: extent,
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
      var tileGrid = new ol.tilegrid.TileGrid({
        resolutions: resolutions,
        extent: extent,
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
      var tileGrid = new ol.tilegrid.TileGrid({
        resolutions: resolutions,
        extent: extent,
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

  describe('getTileRangeForExtentAndResolution', function() {
    it('returns the expected TileRange', function() {
      var tileGrid = new ol.tilegrid.TileGrid({
        resolutions: resolutions,
        extent: extent,
        origin: origin,
        tileSize: tileSize
      });
      var tileRange;

      tileRange = tileGrid.getTileRangeForExtentAndResolution(extent,
          resolutions[0]);
      expect(tileRange.minY).to.eql(0);
      expect(tileRange.minX).to.eql(0);
      expect(tileRange.maxX).to.eql(0);
      expect(tileRange.maxY).to.eql(0);

      tileRange = tileGrid.getTileRangeForExtentAndResolution(extent,
          resolutions[1]);
      expect(tileRange.minX).to.eql(0);
      expect(tileRange.minY).to.eql(0);
      expect(tileRange.maxX).to.eql(1);
      expect(tileRange.maxY).to.eql(1);

      tileRange = tileGrid.getTileRangeForExtentAndResolution(extent,
          resolutions[2]);
      expect(tileRange.minX).to.eql(0);
      expect(tileRange.minY).to.eql(0);
      expect(tileRange.maxX).to.eql(3);
      expect(tileRange.maxY).to.eql(3);

      tileRange = tileGrid.getTileRangeForExtentAndResolution(extent,
          resolutions[3]);
      expect(tileRange.minX).to.eql(0);
      expect(tileRange.minY).to.eql(0);
      expect(tileRange.maxX).to.eql(9);
      expect(tileRange.maxY).to.eql(9);
    });
  });

  describe('getTileRangeForExtentAndZ', function() {
    it('returns the expected TileRange', function() {
      var tileGrid = new ol.tilegrid.TileGrid({
        resolutions: resolutions,
        extent: extent,
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

  describe('forEachTileCoordParentTileRange', function() {
    it('iterates as expected', function() {
      var tileGrid = new ol.tilegrid.TileGrid({
        resolutions: resolutions,
        extent: extent,
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
      var tileGrid = new ol.tilegrid.TileGrid({
        resolutions: resolutions,
        extent: extent,
        origin: origin,
        tileSize: tileSize
      });

      expect(tileGrid.getZForResolution(1000)).to.eql(0);
      expect(tileGrid.getZForResolution(500)).to.eql(1);
      expect(tileGrid.getZForResolution(250)).to.eql(2);
      expect(tileGrid.getZForResolution(100)).to.eql(3);
    });
  });

  describe('getZForResolution (approcimate)', function() {
    it('returns the expected z value', function() {
      var tileGrid = new ol.tilegrid.TileGrid({
        resolutions: resolutions,
        extent: extent,
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

});

goog.require('ol.Coordinate');
goog.require('ol.extent');
goog.require('ol.extent.Corner');
goog.require('ol.proj');
goog.require('ol.proj.METERS_PER_UNIT');
goog.require('ol.proj');
goog.require('ol.proj.EPSG3857');
goog.require('ol.proj.Projection');
goog.require('ol.proj.Units');
goog.require('ol.tilegrid.TileGrid');
