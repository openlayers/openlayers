goog.require('goog.testing.jsunit');
goog.require('ol.TileBounds');


function testContainsPositive() {
  var tb = new ol.TileBounds(0, 2, 2, 0);
  var tc = new ol.TileCoord(3, 1, 1);
  assertTrue(tb.contains(tc));
}


function testContainsNegative() {
  var tb = new ol.TileBounds(0, 2, 2, 0);
  var tc = new ol.TileCoord(3, 1, 3);
  assertFalse(tb.contains(tc));
}


function testBoundingTileBounds() {
  var tb = new ol.TileBounds.boundingTileBounds(
      new ol.TileCoord(3, 1, 3),
      new ol.TileCoord(3, 2, 0));
  assertEquals(tb.top, 0);
  assertEquals(tb.right, 2);
  assertEquals(tb.bottom, 3);
  assertEquals(tb.left, 1);
}


function testBoundingTileBoundsMixedZ() {
  assertThrows(function() {
    var tb = new ol.TileBounds.boundingTileBounds(
        new ol.TileCoord(3, 1, 3),
        new ol.TileCoord(4, 2, 0));
  });
}


function testForEachTileCoord() {

  var tileBounds = new ol.TileBounds(2, 1, 3, 0);

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
