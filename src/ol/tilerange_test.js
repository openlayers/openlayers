goog.require('goog.testing.jsunit');
goog.require('ol.TileRange');


function testClone() {
  var tileRange = new ol.TileRange(1, 2, 3, 4);
  var clonedTileRange = tileRange.clone();
  assertTrue(clonedTileRange instanceof ol.TileRange);
  assertFalse(clonedTileRange === tileRange);
  assertEquals(tileRange.minX, clonedTileRange.minX);
  assertEquals(tileRange.minY, clonedTileRange.minY);
  assertEquals(tileRange.maxX, clonedTileRange.maxX);
  assertEquals(tileRange.maxY, clonedTileRange.maxY);
}


function testContains() {
  var tileRange = new ol.TileRange(1, 1, 3, 3);
  assertFalse(tileRange.contains(new ol.TileCoord(0, 0, 0)));
  assertFalse(tileRange.contains(new ol.TileCoord(0, 0, 1)));
  assertFalse(tileRange.contains(new ol.TileCoord(0, 0, 2)));
  assertFalse(tileRange.contains(new ol.TileCoord(0, 0, 3)));
  assertFalse(tileRange.contains(new ol.TileCoord(0, 0, 4)));
  assertFalse(tileRange.contains(new ol.TileCoord(0, 1, 0)));
  assertTrue(tileRange.contains(new ol.TileCoord(0, 1, 1)));
  assertTrue(tileRange.contains(new ol.TileCoord(0, 1, 2)));
  assertTrue(tileRange.contains(new ol.TileCoord(0, 1, 3)));
  assertFalse(tileRange.contains(new ol.TileCoord(0, 1, 4)));
  assertFalse(tileRange.contains(new ol.TileCoord(0, 2, 0)));
  assertTrue(tileRange.contains(new ol.TileCoord(0, 2, 1)));
  assertTrue(tileRange.contains(new ol.TileCoord(0, 2, 2)));
  assertTrue(tileRange.contains(new ol.TileCoord(0, 2, 3)));
  assertFalse(tileRange.contains(new ol.TileCoord(0, 2, 4)));
  assertFalse(tileRange.contains(new ol.TileCoord(0, 3, 0)));
  assertTrue(tileRange.contains(new ol.TileCoord(0, 3, 1)));
  assertTrue(tileRange.contains(new ol.TileCoord(0, 3, 2)));
  assertTrue(tileRange.contains(new ol.TileCoord(0, 3, 3)));
  assertFalse(tileRange.contains(new ol.TileCoord(0, 3, 4)));
  assertFalse(tileRange.contains(new ol.TileCoord(0, 4, 0)));
  assertFalse(tileRange.contains(new ol.TileCoord(0, 4, 1)));
  assertFalse(tileRange.contains(new ol.TileCoord(0, 4, 2)));
  assertFalse(tileRange.contains(new ol.TileCoord(0, 4, 3)));
  assertFalse(tileRange.contains(new ol.TileCoord(0, 4, 4)));
}


function testBoundingTileRange() {
  var tileRange = new ol.TileRange.boundingTileRange(
      new ol.TileCoord(3, 1, 3),
      new ol.TileCoord(3, 2, 0));
  assertEquals(1, tileRange.minX);
  assertEquals(0, tileRange.minY);
  assertEquals(2, tileRange.maxX);
  assertEquals(3, tileRange.maxY);
}


function testBoundingTileRangeMixedZ() {
  assertThrows(function() {
    var tileRange = new ol.TileRange.boundingTileRange(
        new ol.TileCoord(3, 1, 3),
        new ol.TileCoord(4, 2, 0));
  });
}


function testForEachTileCoord() {

  var tileRange = new ol.TileRange(0, 2, 1, 3);

  var tileCoords = [];
  tileRange.forEachTileCoord(5, function(tileCoord) {
    tileCoords.push(tileCoord.clone());
  });

  assertEquals(4, tileCoords.length);

  assertEquals(5, tileCoords[0].z);
  assertEquals(0, tileCoords[0].x);
  assertEquals(2, tileCoords[0].y);

  assertEquals(5, tileCoords[1].z);
  assertEquals(0, tileCoords[1].x);
  assertEquals(3, tileCoords[1].y);

  assertEquals(5, tileCoords[2].z);
  assertEquals(1, tileCoords[2].x);
  assertEquals(2, tileCoords[2].y);

  assertEquals(5, tileCoords[3].z);
  assertEquals(1, tileCoords[3].x);
  assertEquals(3, tileCoords[3].y);

}


function testSize() {
  var tileRange = new ol.TileRange(0, 1, 2, 4);
  var size = tileRange.getSize();
  assertEquals(3, size.width);
  assertEquals(4, size.height);
}
