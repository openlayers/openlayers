goog.require('goog.math.Coordinate');
goog.require('goog.math.Size');
goog.require('goog.testing.jsunit');
goog.require('ol.Extent');
goog.require('ol.TileCoord');
goog.require('ol.TileGrid');


var extent;
var resolutions;
var origin;
var origins;
var tileSize;


function setUp() {
  resolutions = [1000, 500, 250, 100];
  extent = new ol.Extent(0, 0, 100000, 100000);
  origin = new goog.math.Coordinate(0, 0);
  origins = [];
  tileSize = new goog.math.Size(100, 100);
}


function testCreateValid() {
  assertNotThrows(function() {
    return new ol.TileGrid(resolutions, extent, origin, tileSize);
  });
}


function testCreateDuplicateResolutions() {
  var resolutions = [100, 50, 50, 25, 10];
  assertThrows(function() {
    return new ol.TileGrid(resolutions, extent, origin, tileSize);
  });
}


function testCreateOutOfOrderResolutions() {
  var resolutions = [100, 25, 50, 10];
  assertThrows(function() {
    return new ol.TileGrid(resolutions, extent, origin, tileSize);
  });
}


function testCreateOrigins() {
  var resolutions = [100, 50, 25, 10];
  var origins = [origin, origin, origin, origin];
  assertNotThrows(function() {
    return new ol.TileGrid(resolutions, extent, origins, tileSize);
  });
}


function testCreateTooFewOrigins() {
  var resolutions = [100, 50, 25, 10];
  var origins = [origin, origin, origin];
  assertThrows(function() {
    return new ol.TileGrid(resolutions, extent, origins, tileSize);
  });
}


function testCreateTooManyOrigins() {
  var resolutions = [100, 50, 25, 10];
  var origins = [origin, origin, origin, origin, origin];
  assertThrows(function() {
    return new ol.TileGrid(resolutions, extent, origins, tileSize);
  });
}


function testGetTileCoord() {

  origin = new goog.math.Coordinate(0, 0);
  var tileGrid = new ol.TileGrid(resolutions, extent, origin, tileSize);
  var tileCoord;

  tileCoord = tileGrid.getTileCoord(3, new goog.math.Coordinate(0, 0));
  assertEquals(3, tileCoord.z);
  assertEquals(0, tileCoord.x);
  assertEquals(0, tileCoord.y);

  tileCoord = tileGrid.getTileCoord(3, new goog.math.Coordinate(0, 100000));
  assertEquals(3, tileCoord.z);
  assertEquals(0, tileCoord.x);
  assertEquals(10, tileCoord.y);

  tileCoord = tileGrid.getTileCoord(3, new goog.math.Coordinate(100000, 0));
  assertEquals(3, tileCoord.z);
  assertEquals(10, tileCoord.x);
  assertEquals(0, tileCoord.y);

  tileCoord =
      tileGrid.getTileCoord(3, new goog.math.Coordinate(100000, 100000));
  assertEquals(3, tileCoord.z);
  assertEquals(10, tileCoord.x);
  assertEquals(10, tileCoord.y);

}


function testGetTileCoordYSouth() {

  origin = new goog.math.Coordinate(0, 100000);
  var tileGrid = new ol.TileGrid(resolutions, extent, origin, tileSize);
  var tileCoord;

  tileCoord = tileGrid.getTileCoord(3, new goog.math.Coordinate(0, 0));
  assertEquals(3, tileCoord.z);
  assertEquals(0, tileCoord.x);
  assertEquals(-10, tileCoord.y);

  tileCoord = tileGrid.getTileCoord(3, new goog.math.Coordinate(0, 100000));
  assertEquals(3, tileCoord.z);
  assertEquals(0, tileCoord.x);
  assertEquals(0, tileCoord.y);

  tileCoord = tileGrid.getTileCoord(3, new goog.math.Coordinate(100000, 0));
  assertEquals(3, tileCoord.z);
  assertEquals(10, tileCoord.x);
  assertEquals(-10, tileCoord.y);

  tileCoord =
      tileGrid.getTileCoord(3, new goog.math.Coordinate(100000, 100000));
  assertEquals(3, tileCoord.z);
  assertEquals(10, tileCoord.x);
  assertEquals(0, tileCoord.y);

}


function testGetTileCoordCenter() {

  var tileGrid = new ol.TileGrid(resolutions, extent, origin, tileSize);
  var center;

  center = tileGrid.getTileCoordCenter(new ol.TileCoord(0, 0, 0));
  assertEquals(50000, center.x);
  assertEquals(50000, center.y);

  center = tileGrid.getTileCoordCenter(new ol.TileCoord(3, 0, 0));
  assertEquals(5000, center.x);
  assertEquals(5000, center.y);

  center = tileGrid.getTileCoordCenter(new ol.TileCoord(3, 9, 9));
  assertEquals(95000, center.x);
  assertEquals(95000, center.y);

}


function testGetTileCoordExtent() {

  var tileGrid = new ol.TileGrid(resolutions, extent, origin, tileSize);
  var tileCoordExtent;

  tileCoordExtent = tileGrid.getTileCoordExtent(new ol.TileCoord(0, 0, 0));
  assertEquals(0, tileCoordExtent.minX);
  assertEquals(0, tileCoordExtent.minY);
  assertEquals(100000, tileCoordExtent.maxX);
  assertEquals(100000, tileCoordExtent.maxY);

  tileCoordExtent = tileGrid.getTileCoordExtent(new ol.TileCoord(3, 9, 0));
  assertEquals(90000, tileCoordExtent.minX);
  assertEquals(0, tileCoordExtent.minY);
  assertEquals(100000, tileCoordExtent.maxX);
  assertEquals(10000, tileCoordExtent.maxY);

  tileCoordExtent = tileGrid.getTileCoordExtent(new ol.TileCoord(3, 0, 9));
  assertEquals(0, tileCoordExtent.minX);
  assertEquals(90000, tileCoordExtent.minY);
  assertEquals(10000, tileCoordExtent.maxX);
  assertEquals(100000, tileCoordExtent.maxY);

}


function testGetExtentTileBounds() {

  var tileGrid = new ol.TileGrid(resolutions, extent, origin, tileSize);
  var e = new ol.Extent(45000, 5000, 55000, 15000);
  var tileBounds;

  tileBounds = tileGrid.getExtentTileBounds(0, e);
  assertEquals(0, tileBounds.minY);
  assertEquals(0, tileBounds.minX);
  assertEquals(0, tileBounds.maxX);
  assertEquals(0, tileBounds.maxY);

  tileBounds = tileGrid.getExtentTileBounds(1, e);
  assertEquals(0, tileBounds.minX);
  assertEquals(0, tileBounds.minY);
  assertEquals(1, tileBounds.maxX);
  assertEquals(0, tileBounds.maxY);

  tileBounds = tileGrid.getExtentTileBounds(2, e);
  assertEquals(1, tileBounds.minX);
  assertEquals(0, tileBounds.minY);
  assertEquals(2, tileBounds.maxX);
  assertEquals(0, tileBounds.maxY);

  tileBounds = tileGrid.getExtentTileBounds(3, e);
  assertEquals(4, tileBounds.minX);
  assertEquals(0, tileBounds.minY);
  assertEquals(5, tileBounds.maxX);
  assertEquals(1, tileBounds.maxY);

}


function testForEachTileCoordParent() {

  var tileGrid = new ol.TileGrid(resolutions, extent, origin, tileSize);
  var zs = [], tileBoundss = [];

  tileGrid.forEachTileCoordParent(
      new ol.TileCoord(3, 7, 3),
      function(z, tileBounds) {
        zs.push(z);
        tileBoundss.push(tileBounds);
        return false;
      });

  assertEquals(3, zs.length);
  assertEquals(3, tileBoundss.length);

  assertEquals(2, zs[0]);
  assertEquals(2, tileBoundss[0].minX);
  assertEquals(1, tileBoundss[0].minY);
  assertEquals(3, tileBoundss[0].maxX);
  assertEquals(1, tileBoundss[0].maxY);

  assertEquals(1, zs[1]);
  assertEquals(1, tileBoundss[1].minX);
  assertEquals(0, tileBoundss[1].minY);
  assertEquals(1, tileBoundss[1].maxX);
  assertEquals(0, tileBoundss[1].maxY);

  assertEquals(0, zs[2]);
  assertEquals(0, tileBoundss[2].minX);
  assertEquals(0, tileBoundss[2].minY);
  assertEquals(0, tileBoundss[2].maxX);
  assertEquals(0, tileBoundss[2].maxY);

}


function testGetZForResolutionExact() {

  var tileGrid =
      new ol.TileGrid(resolutions, extent, origin, tileSize);

  assertEquals(0, tileGrid.getZForResolution(1000));
  assertEquals(1, tileGrid.getZForResolution(500));
  assertEquals(2, tileGrid.getZForResolution(250));
  assertEquals(3, tileGrid.getZForResolution(100));

}


function testGetZForResolutionApproximate() {

  var tileGrid =
      new ol.TileGrid(resolutions, extent, origin, tileSize);

  assertEquals(0, tileGrid.getZForResolution(2000));
  assertEquals(0, tileGrid.getZForResolution(1000));
  assertEquals(0, tileGrid.getZForResolution(900));
  assertEquals(1, tileGrid.getZForResolution(750));
  assertEquals(1, tileGrid.getZForResolution(625));
  assertEquals(1, tileGrid.getZForResolution(500));
  assertEquals(1, tileGrid.getZForResolution(475));
  assertEquals(2, tileGrid.getZForResolution(375));
  assertEquals(2, tileGrid.getZForResolution(250));
  assertEquals(2, tileGrid.getZForResolution(200));
  assertEquals(3, tileGrid.getZForResolution(125));
  assertEquals(3, tileGrid.getZForResolution(100));
  assertEquals(3, tileGrid.getZForResolution(50));

}
