goog.require('goog.testing.jsunit');
goog.require('ol.TileBounds');


function testClone() {
  var tileBounds = new ol.TileBounds(1, 2, 3, 4);
  var clonedTileBounds = tileBounds.clone();
  assertTrue(clonedTileBounds instanceof ol.TileBounds);
  assertFalse(clonedTileBounds === tileBounds);
  assertEquals(tileBounds.minX, clonedTileBounds.minX);
  assertEquals(tileBounds.minY, clonedTileBounds.minY);
  assertEquals(tileBounds.maxX, clonedTileBounds.maxX);
  assertEquals(tileBounds.maxY, clonedTileBounds.maxY);
}


function testContainsPositive() {
  var tileBounds = new ol.TileBounds(0, 0, 2, 2);
  var tileCoord = new ol.TileCoord(3, 1, 1);
  assertTrue(tileBounds.contains(tileCoord));
}


function testContainsNegative() {
  var tileBounds = new ol.TileBounds(0, 0, 2, 2);
  var tileCoord = new ol.TileCoord(3, 1, 3);
  assertFalse(tileBounds.contains(tileCoord));
}


function testBoundingTileBounds() {
  var tileBounds = new ol.TileBounds.boundingTileBounds(
      new ol.TileCoord(3, 1, 3),
      new ol.TileCoord(3, 2, 0));
  assertEquals(1, tileBounds.minX);
  assertEquals(0, tileBounds.minY);
  assertEquals(2, tileBounds.maxX);
  assertEquals(3, tileBounds.maxY);
}


function testBoundingTileBoundsMixedZ() {
  assertThrows(function() {
    var tileBounds = new ol.TileBounds.boundingTileBounds(
        new ol.TileCoord(3, 1, 3),
        new ol.TileCoord(4, 2, 0));
  });
}


function testForEachTileCoord() {

  var tileBounds = new ol.TileBounds(0, 2, 1, 3);

  var tileCoords = [];
  tileBounds.forEachTileCoord(5, function(tileCoord) {
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
  var tileBounds = new ol.TileBounds(0, 1, 2, 4);
  var size = tileBounds.getSize();
  assertEquals(3, size.width);
  assertEquals(4, size.height);
}
