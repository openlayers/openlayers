goog.require('goog.testing.jsunit');
goog.require('ol3.TileCoord');


function testConstructorOrderZXY() {
  var tc1 = new ol3.TileCoord(1, 2, 3);
  assertEquals(1, tc1.z);
  assertEquals(2, tc1.x);
  assertEquals(3, tc1.y);
}


function testCreateFromQuadKey() {
  var tileCoord = ol3.TileCoord.createFromQuadKey('213');
  assertEquals(3, tileCoord.z);
  assertEquals(3, tileCoord.x);
  assertEquals(5, tileCoord.y);
}


function testCreateFromString() {
  var str = '1/2/3';
  var tc = ol3.TileCoord.createFromString(str);
  assertEquals(1, tc.z);
  assertEquals(2, tc.x);
  assertEquals(3, tc.y);
}


function testQuadKey() {
  assertEquals('213', (new ol3.TileCoord(3, 3, 5)).quadKey());
}


function testHash() {
  var tc1 = new ol3.TileCoord(3, 2, 1);
  var tc2 = new ol3.TileCoord(3, 1, 1);
  assertTrue(tc1.hash() != tc2.hash());
}
