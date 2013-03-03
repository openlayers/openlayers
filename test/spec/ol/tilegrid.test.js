goog.provide('ol.test.TileGrid');

describe('ol.tilegrid.TileGrid', function() {
  var extent;
  var resolutions;
  var origin;
  var origins;
  var tileSize;

  beforeEach(function() {
    resolutions = [1000, 500, 250, 100];
    extent = new ol.Extent(0, 0, 100000, 100000);
    origin = new ol.Coordinate(0, 0);
    origins = [];
    tileSize = new ol.Size(100, 100);
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
      }).not.toThrow();
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
      }).toThrow();
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
      }).toThrow();
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
      }).not.toThrow();
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
      }).toThrow();
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
      }).toThrow();
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
      }).toThrow();
    });
  });

  describe('createForProjection', function() {

    it('allows easier creation of a tile grid', function() {
      var projection = ol.projection.getFromCode('EPSG:3857');
      var grid = ol.tilegrid.createForProjection(projection);
      expect(grid).toBeA(ol.tilegrid.TileGrid);

      var resolutions = grid.getResolutions();
      expect(resolutions.length).toBe(19);
    });

    it('accepts a number of zoom levels', function() {
      var projection = ol.projection.getFromCode('EPSG:3857');
      var grid = ol.tilegrid.createForProjection(projection, 22);
      expect(grid).toBeA(ol.tilegrid.TileGrid);

      var resolutions = grid.getResolutions();
      expect(resolutions.length).toBe(23);
    });

    it('accepts a big number of zoom levels', function() {
      var projection = ol.projection.getFromCode('EPSG:3857');
      var grid = ol.tilegrid.createForProjection(projection, 23);
      expect(grid).toBeA(ol.tilegrid.TileGrid);

      var resolutions = grid.getResolutions();
      expect(resolutions.length).toBe(24);
    });

  });

  describe('getTileCoordFromCoordAndZ', function() {

    describe('Y North, X East', function() {
      it('returns the expected TileCoord', function() {
        origin = new ol.Coordinate(0, 0);
        var tileGrid = new ol.tilegrid.TileGrid({
          resolutions: resolutions,
          extent: extent,
          origin: origin,
          tileSize: tileSize
        });
        var tileCoord;

        tileCoord = tileGrid.getTileCoordForCoordAndZ(
            new ol.Coordinate(0, 0), 3);
        expect(tileCoord.z).toEqual(3);
        expect(tileCoord.x).toEqual(0);
        expect(tileCoord.y).toEqual(0);

        tileCoord = tileGrid.getTileCoordForCoordAndZ(
            new ol.Coordinate(0, 100000), 3);
        expect(tileCoord.z).toEqual(3);
        expect(tileCoord.x).toEqual(0);
        expect(tileCoord.y).toEqual(10);

        tileCoord = tileGrid.getTileCoordForCoordAndZ(
            new ol.Coordinate(100000, 0), 3);
        expect(tileCoord.z).toEqual(3);
        expect(tileCoord.x).toEqual(10);
        expect(tileCoord.y).toEqual(0);

        tileCoord = tileGrid.getTileCoordForCoordAndZ(
            new ol.Coordinate(100000, 100000), 3);
        expect(tileCoord.z).toEqual(3);
        expect(tileCoord.x).toEqual(10);
        expect(tileCoord.y).toEqual(10);
      });
    });

    describe('Y South, X East', function() {
      it('returns the expected TileCoord', function() {
        origin = new ol.Coordinate(0, 100000);
        var tileGrid = new ol.tilegrid.TileGrid({
          resolutions: resolutions,
          extent: extent,
          origin: origin,
          tileSize: tileSize
        });
        var tileCoord;

        tileCoord = tileGrid.getTileCoordForCoordAndZ(
            new ol.Coordinate(0, 0), 3);
        expect(tileCoord.z).toEqual(3);
        expect(tileCoord.x).toEqual(0);
        expect(tileCoord.y).toEqual(-10);

        tileCoord = tileGrid.getTileCoordForCoordAndZ(
            new ol.Coordinate(0, 100000), 3);
        expect(tileCoord.z).toEqual(3);
        expect(tileCoord.x).toEqual(0);
        expect(tileCoord.y).toEqual(0);

        tileCoord = tileGrid.getTileCoordForCoordAndZ(
            new ol.Coordinate(100000, 0), 3);
        expect(tileCoord.z).toEqual(3);
        expect(tileCoord.x).toEqual(10);
        expect(tileCoord.y).toEqual(-10);

        tileCoord = tileGrid.getTileCoordForCoordAndZ(
            new ol.Coordinate(100000, 100000), 3);
        expect(tileCoord.z).toEqual(3);
        expect(tileCoord.x).toEqual(10);
        expect(tileCoord.y).toEqual(0);
      });
    });
  });

  describe('getTileCoordForCoordAndResolution', function() {
    it('returns the expected TileCoord', function() {
      var tileSize = new ol.Size(256, 256);
      var tileGrid = new ol.tilegrid.TileGrid({
        resolutions: [10],
        extent: extent,
        origin: origin,
        tileSize: tileSize
      });

      var coordinate;
      var tileCoord;

      // gets the first tile at the origin
      coordinate = new ol.Coordinate(0, 0);
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(
          coordinate, 10);
      expect(tileCoord.z).toEqual(0);
      expect(tileCoord.x).toEqual(0);
      expect(tileCoord.y).toEqual(0);

      // gets one tile northwest of the origin
      coordinate = new ol.Coordinate(-1280, 1280);
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(
          coordinate, 10);
      expect(tileCoord.z).toEqual(0);
      expect(tileCoord.x).toEqual(-1);
      expect(tileCoord.y).toEqual(0);

      // gets one tile northeast of the origin
      coordinate = new ol.Coordinate(1280, 1280);
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(
          coordinate, 10);
      expect(tileCoord.z).toEqual(0);
      expect(tileCoord.x).toEqual(0);
      expect(tileCoord.y).toEqual(0);

      // gets one tile southeast of the origin
      coordinate = new ol.Coordinate(1280, -1280);
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(
          coordinate, 10);
      expect(tileCoord.z).toEqual(0);
      expect(tileCoord.x).toEqual(0);
      expect(tileCoord.y).toEqual(-1);

      // gets one tile southwest of the origin
      coordinate = new ol.Coordinate(-1280, -1280);
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(
          coordinate, 10);
      expect(tileCoord.z).toEqual(0);
      expect(tileCoord.x).toEqual(-1);
      expect(tileCoord.y).toEqual(-1);

      // gets the tile to the east when on the edge
      coordinate = new ol.Coordinate(2560, -1280);
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(
          coordinate, 10);
      expect(tileCoord.z).toEqual(0);
      expect(tileCoord.x).toEqual(1);
      expect(tileCoord.y).toEqual(-1);

      // gets the tile to the north when on the edge
      coordinate = new ol.Coordinate(1280, -2560);
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(
          coordinate, 10);
      expect(tileCoord.z).toEqual(0);
      expect(tileCoord.x).toEqual(0);
      expect(tileCoord.y).toEqual(-1);

      // pixels are top aligned to the origin
      coordinate = new ol.Coordinate(1280, -2559.999);
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(
          coordinate, 10);
      expect(tileCoord.z).toEqual(0);
      expect(tileCoord.x).toEqual(0);
      expect(tileCoord.y).toEqual(-1);

      // pixels are left aligned to the origin
      coordinate = new ol.Coordinate(2559.999, -1280);
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(
          coordinate, 10);
      expect(tileCoord.z).toEqual(0);
      expect(tileCoord.x).toEqual(0);
      expect(tileCoord.y).toEqual(-1);
    });
  });


  describe('getTileCoordForCoordAndResolution_', function() {
    it('returns higher tile coord for intersections by default', function() {
      var tileGrid = new ol.tilegrid.TileGrid({
        resolutions: resolutions,
        extent: extent,
        origin: origin,
        tileSize: tileSize
      });

      var coordinate;
      var tileCoord;

      // gets higher tile for edge intersection
      coordinate = new ol.Coordinate(0, 0);
      tileCoord = tileGrid.getTileCoordForCoordAndResolution_(
          coordinate, 100);
      expect(tileCoord.z).toEqual(3);
      expect(tileCoord.x).toEqual(0);
      expect(tileCoord.y).toEqual(0);

      // gets higher tile for edge intersection
      coordinate = new ol.Coordinate(100000, 100000);
      tileCoord = tileGrid.getTileCoordForCoordAndResolution_(
          coordinate, 100);
      expect(tileCoord.z).toEqual(3);
      expect(tileCoord.x).toEqual(10);
      expect(tileCoord.y).toEqual(10);

    });

    it('handles alt intersection policy', function() {
      var tileGrid = new ol.tilegrid.TileGrid({
        resolutions: resolutions,
        extent: extent,
        origin: origin,
        tileSize: tileSize
      });

      var coordinate;
      var tileCoord;

      // can get lower tile for edge intersection
      coordinate = new ol.Coordinate(0, 0);
      tileCoord = tileGrid.getTileCoordForCoordAndResolution_(
          coordinate, 100, true);
      expect(tileCoord.z).toEqual(3);
      expect(tileCoord.x).toEqual(-1);
      expect(tileCoord.y).toEqual(-1);

      // gets higher tile for edge intersection
      coordinate = new ol.Coordinate(100000, 100000);
      tileCoord = tileGrid.getTileCoordForCoordAndResolution_(
          coordinate, 100, true);
      expect(tileCoord.z).toEqual(3);
      expect(tileCoord.x).toEqual(9);
      expect(tileCoord.y).toEqual(9);

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

      center = tileGrid.getTileCoordCenter(new ol.TileCoord(0, 0, 0));
      expect(center.x).toEqual(50000);
      expect(center.y).toEqual(50000);

      center = tileGrid.getTileCoordCenter(new ol.TileCoord(3, 0, 0));
      expect(center.x).toEqual(5000);
      expect(center.y).toEqual(5000);

      center = tileGrid.getTileCoordCenter(new ol.TileCoord(3, 9, 9));
      expect(center.x).toEqual(95000);
      expect(center.y).toEqual(95000);
    });
  });

  describe('getTileCoordExent', function() {
    it('returns the expected extend', function() {
      var tileGrid = new ol.tilegrid.TileGrid({
        resolutions: resolutions,
        extent: extent,
        origin: origin,
        tileSize: tileSize
      });
      var tileCoordExtent;

      tileCoordExtent = tileGrid.getTileCoordExtent(new ol.TileCoord(0, 0, 0));
      expect(tileCoordExtent.minX).toEqual(0);
      expect(tileCoordExtent.minY).toEqual(0);
      expect(tileCoordExtent.maxX).toEqual(100000);
      expect(tileCoordExtent.maxY).toEqual(100000);

      tileCoordExtent = tileGrid.getTileCoordExtent(new ol.TileCoord(3, 9, 0));
      expect(tileCoordExtent.minX).toEqual(90000);
      expect(tileCoordExtent.minY).toEqual(0);
      expect(tileCoordExtent.maxX).toEqual(100000);
      expect(tileCoordExtent.maxY).toEqual(10000);

      tileCoordExtent = tileGrid.getTileCoordExtent(new ol.TileCoord(3, 0, 9));
      expect(tileCoordExtent.minX).toEqual(0);
      expect(tileCoordExtent.minY).toEqual(90000);
      expect(tileCoordExtent.maxX).toEqual(10000);
      expect(tileCoordExtent.maxY).toEqual(100000);
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
      expect(tileRange.minY).toEqual(0);
      expect(tileRange.minX).toEqual(0);
      expect(tileRange.maxX).toEqual(0);
      expect(tileRange.maxY).toEqual(0);

      tileRange = tileGrid.getTileRangeForExtentAndResolution(extent,
          resolutions[1]);
      expect(tileRange.minX).toEqual(0);
      expect(tileRange.minY).toEqual(0);
      expect(tileRange.maxX).toEqual(1);
      expect(tileRange.maxY).toEqual(1);

      tileRange = tileGrid.getTileRangeForExtentAndResolution(extent,
          resolutions[2]);
      expect(tileRange.minX).toEqual(0);
      expect(tileRange.minY).toEqual(0);
      expect(tileRange.maxX).toEqual(3);
      expect(tileRange.maxY).toEqual(3);

      tileRange = tileGrid.getTileRangeForExtentAndResolution(extent,
          resolutions[3]);
      expect(tileRange.minX).toEqual(0);
      expect(tileRange.minY).toEqual(0);
      expect(tileRange.maxX).toEqual(9);
      expect(tileRange.maxY).toEqual(9);
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
      var e = new ol.Extent(45000, 5000, 55000, 15000);
      var tileRange;

      tileRange = tileGrid.getTileRangeForExtentAndZ(e, 0);
      expect(tileRange.minY).toEqual(0);
      expect(tileRange.minX).toEqual(0);
      expect(tileRange.maxX).toEqual(0);
      expect(tileRange.maxY).toEqual(0);

      tileRange = tileGrid.getTileRangeForExtentAndZ(e, 1);
      expect(tileRange.minX).toEqual(0);
      expect(tileRange.minY).toEqual(0);
      expect(tileRange.maxX).toEqual(1);
      expect(tileRange.maxY).toEqual(0);

      tileRange = tileGrid.getTileRangeForExtentAndZ(e, 2);
      expect(tileRange.minX).toEqual(1);
      expect(tileRange.minY).toEqual(0);
      expect(tileRange.maxX).toEqual(2);
      expect(tileRange.maxY).toEqual(0);

      tileRange = tileGrid.getTileRangeForExtentAndZ(e, 3);
      expect(tileRange.minX).toEqual(4);
      expect(tileRange.minY).toEqual(0);
      expect(tileRange.maxX).toEqual(5);
      expect(tileRange.maxY).toEqual(1);
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
          new ol.TileCoord(3, 7, 3),
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

  describe('getZForResolution (exact)', function() {
    it('returns the expected z value', function() {
      var tileGrid = new ol.tilegrid.TileGrid({
        resolutions: resolutions,
        extent: extent,
        origin: origin,
        tileSize: tileSize
      });

      expect(tileGrid.getZForResolution(1000)).toEqual(0);
      expect(tileGrid.getZForResolution(500)).toEqual(1);
      expect(tileGrid.getZForResolution(250)).toEqual(2);
      expect(tileGrid.getZForResolution(100)).toEqual(3);
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

});

goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.Size');
goog.require('ol.TileCoord');
goog.require('ol.projection');
goog.require('ol.tilegrid.TileGrid');
