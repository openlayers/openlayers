goog.require('goog.testing.jsunit');
goog.require('ol.TileCoord');
goog.require('ol.TileUrl');


function testCreateFromTemplate() {
  var tileUrl = ol.TileUrl.createFromTemplate('{z}/{x}/{y}');
  assertEquals('3/2/1', tileUrl(new ol.TileCoord(3, 2, 1)));
}


function testCreateFromTileUrlFunctions() {
  var tileUrl = ol.TileUrl.createFromTileUrlFunctions([
    ol.TileUrl.createFromTemplate('a'),
    ol.TileUrl.createFromTemplate('b')
  ]);
  var tileUrl1 = tileUrl(new ol.TileCoord(1, 0, 0));
  var tileUrl2 = tileUrl(new ol.TileCoord(1, 0, 1));
  assertTrue(tileUrl1 != tileUrl2);
}
