goog.require('goog.testing.jsunit');
goog.require('ol3.TileCoord');
goog.require('ol3.TileUrlFunction');


function testCreateFromTemplate() {
  var tileUrl = ol3.TileUrlFunction.createFromTemplate('{z}/{x}/{y}');
  assertEquals('3/2/1', tileUrl(new ol3.TileCoord(3, 2, 1)));
  assertUndefined(tileUrl(null));
}


function testWithTileCoordTransform() {
  var tileUrl = ol3.TileUrlFunction.withTileCoordTransform(
      function(tileCoord) {
        return new ol3.TileCoord(tileCoord.z, tileCoord.x, -tileCoord.y);
      },
      ol3.TileUrlFunction.createFromTemplate('{z}/{x}/{y}'));
  assertEquals('3/2/1', tileUrl(new ol3.TileCoord(3, 2, -1)));
  assertUndefined(tileUrl(null));
}


function testCreateFromTileUrlFunctions() {
  var tileUrl = ol3.TileUrlFunction.createFromTileUrlFunctions([
    ol3.TileUrlFunction.createFromTemplate('a'),
    ol3.TileUrlFunction.createFromTemplate('b')
  ]);
  var tileUrl1 = tileUrl(new ol3.TileCoord(1, 0, 0));
  var tileUrl2 = tileUrl(new ol3.TileCoord(1, 0, 1));
  assertTrue(tileUrl1 != tileUrl2);
  assertUndefined(tileUrl(null));
}
