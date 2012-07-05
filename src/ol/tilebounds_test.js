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
