goog.require('goog.math.Coordinate');
goog.require('goog.math.Size');
goog.require('goog.positioning.Corner');
goog.require('goog.testing.jsunit');
goog.require('ol.Extent');
goog.require('ol.TileCoord');
goog.require('ol.TileGrid');


var corner;
var extent;
var resolutions;
var origin;
var origins;
var tileSize;


function setUp() {
  corner = goog.positioning.Corner.TOP_LEFT;
  resolutions = [1000, 500, 250, 100];
  extent = new ol.Extent(100000, 100000, 0, 0);
  origin = new goog.math.Coordinate(0, 100000);
  origins = [];
  tileSize = new goog.math.Size(100, 100);
}


function testCreateValid() {
  assertNotThrows(function() {
    return new ol.TileGrid(resolutions, extent, corner, origin, tileSize);
  });
}


function testCreateDuplicateResolutions() {
  var resolutions = [100, 50, 50, 25, 10];
  assertThrows(function() {
    return new ol.TileGrid(resolutions, extent, corner, origin, tileSize);
  });
}


function testCreateOutOfOrderResolutions() {
  var resolutions = [100, 25, 50, 10];
  assertThrows(function() {
    return new ol.TileGrid(resolutions, extent, corner, origin, tileSize);
  });
}


function testCreateOrigins() {
  var resolutions = [100, 50, 25, 10];
  var origins = [origin, origin, origin, origin];
  assertNotThrows(function() {
    return new ol.TileGrid(resolutions, extent, corner, origins, tileSize);
  });
}


function testCreateTooFewOrigins() {
  var resolutions = [100, 50, 25, 10];
  var origins = [origin, origin, origin];
  assertThrows(function() {
    return new ol.TileGrid(resolutions, extent, corner, origins, tileSize);
  });
}


function testCreateTooManyOrigins() {
  var resolutions = [100, 50, 25, 10];
  var origins = [origin, origin, origin, origin, origin];
  assertThrows(function() {
    return new ol.TileGrid(resolutions, extent, corner, origins, tileSize);
  });
}


function testGetTileCoordTopLeft() {

  corner = goog.positioning.Corner.TOP_LEFT;
  origin = new goog.math.Coordinate(0, 100000);
  var tileGrid =
      new ol.TileGrid(resolutions, extent, corner, origin, tileSize);
  var tileCoord;

  tileCoord = tileGrid.getTileCoord(3, new goog.math.Coordinate(0, 0));
  assertEquals(3, tileCoord.z);
  assertEquals(0, tileCoord.x);
  assertEquals(10, tileCoord.y);

  tileCoord = tileGrid.getTileCoord(3, new goog.math.Coordinate(0, 100000));
  assertEquals(3, tileCoord.z);
  assertEquals(0, tileCoord.x);
  assertEquals(0, tileCoord.y);

  tileCoord = tileGrid.getTileCoord(3, new goog.math.Coordinate(100000, 0));
  assertEquals(3, tileCoord.z);
  assertEquals(10, tileCoord.x);
  assertEquals(10, tileCoord.y);

  tileCoord =
      tileGrid.getTileCoord(3, new goog.math.Coordinate(100000, 100000));
  assertEquals(3, tileCoord.z);
  assertEquals(10, tileCoord.x);
  assertEquals(0, tileCoord.y);

}


function testGetTileCoordBottomLeft() {

  corner = goog.positioning.Corner.BOTTOM_LEFT;
  origin = new goog.math.Coordinate(0, 0);
  var tileGrid =
      new ol.TileGrid(resolutions, extent, corner, origin, tileSize);
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


function testGetTileCoordCenter() {

  var tileGrid =
      new ol.TileGrid(resolutions, extent, corner, origin, tileSize);
  var center;

  center = tileGrid.getTileCoordCenter(new ol.TileCoord(0, 0, 0));
  assertEquals(50000, center.x);
  assertEquals(50000, center.y);

  center = tileGrid.getTileCoordCenter(new ol.TileCoord(3, 0, 0));
  assertEquals(5000, center.x);
  assertEquals(95000, center.y);

  center = tileGrid.getTileCoordCenter(new ol.TileCoord(3, 9, 9));
  assertEquals(95000, center.x);
  assertEquals(5000, center.y);

}


function testGetTileCoordExtent() {

  var tileGrid =
      new ol.TileGrid(resolutions, extent, corner, origin, tileSize);
  var tileCoordExtent;

  tileCoordExtent = tileGrid.getTileCoordExtent(new ol.TileCoord(0, 0, 0));
  assertEquals(tileCoordExtent.top, 100000);
  assertEquals(tileCoordExtent.right, 100000);
  assertEquals(tileCoordExtent.bottom, 0);
  assertEquals(tileCoordExtent.left, 0);

  tileCoordExtent = tileGrid.getTileCoordExtent(new ol.TileCoord(3, 9, 0));
  assertEquals(tileCoordExtent.top, 100000);
  assertEquals(tileCoordExtent.right, 100000);
  assertEquals(tileCoordExtent.bottom, 90000);
  assertEquals(tileCoordExtent.left, 90000);

  tileCoordExtent = tileGrid.getTileCoordExtent(new ol.TileCoord(3, 0, 9));
  assertEquals(tileCoordExtent.top, 10000);
  assertEquals(tileCoordExtent.right, 10000);
  assertEquals(tileCoordExtent.bottom, 0);
  assertEquals(tileCoordExtent.left, 0);

}
