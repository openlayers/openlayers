goog.require('goog.testing.jsunit');
goog.require('ol.TileCoord');


function testConstructorOrderZXY() {
  var tc1 = new ol.TileCoord(1, 2, 3);
  assertEquals(1, tc1.z);
  assertEquals(2, tc1.x);
  assertEquals(3, tc1.y);
}


function testHashX() {
  var tc1 = new ol.TileCoord(3, 2, 1);
  var tc2 = new ol.TileCoord(3, 1, 1);
  assertTrue(tc1.hash() != tc2.hash());
}
