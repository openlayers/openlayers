goog.require('goog.testing.jsunit');
goog.require('ol.Coordinate');
goog.require('ol.TileCoord');
goog.require('ol.tilestore.createXYZ');


function testXYZ() {

  var tileStore = ol.tilestore.createXYZ(6, ['{z}/{x}/{y}']);
  var tileGrid = tileStore.getTileGrid();

  var coordinate = new ol.Coordinate(829330.2064098881, 5933916.615134273);
  var tileUrl;

  tileUrl = tileStore.getTileCoordUrl(
      tileGrid.getTileCoordForCoordAndZ(coordinate, 0));
  assertEquals('0/0/0', tileUrl);

  tileUrl = tileStore.getTileCoordUrl(
      tileGrid.getTileCoordForCoordAndZ(coordinate, 1));
  assertEquals('1/1/0', tileUrl);

  tileUrl = tileStore.getTileCoordUrl(
      tileGrid.getTileCoordForCoordAndZ(coordinate, 2));
  assertEquals('2/2/1', tileUrl);

  tileUrl = tileStore.getTileCoordUrl(
      tileGrid.getTileCoordForCoordAndZ(coordinate, 3));
  assertEquals('3/4/2', tileUrl);

  tileUrl = tileStore.getTileCoordUrl(
      tileGrid.getTileCoordForCoordAndZ(coordinate, 4));
  assertEquals('4/8/5', tileUrl);

  tileUrl = tileStore.getTileCoordUrl(
      tileGrid.getTileCoordForCoordAndZ(coordinate, 5));
  assertEquals('5/16/11', tileUrl);

  tileUrl = tileStore.getTileCoordUrl(
      tileGrid.getTileCoordForCoordAndZ(coordinate, 6));
  assertEquals('6/33/22', tileUrl);

}


function testXYZWrapX() {

  var tileStore = ol.tilestore.createXYZ(6, ['{z}/{x}/{y}']);

  tileUrl = tileStore.getTileCoordUrl(new ol.TileCoord(6, -31, -23));
  assertEquals('6/33/22', tileUrl);

  tileUrl = tileStore.getTileCoordUrl(new ol.TileCoord(6, 33, -23));
  assertEquals('6/33/22', tileUrl);

  tileUrl = tileStore.getTileCoordUrl(new ol.TileCoord(6, 97, -23));
  assertEquals('6/33/22', tileUrl);

}


function testXYZCropY() {

  var tileStore = ol.tilestore.createXYZ(6, ['{z}/{x}/{y}']);

  tileUrl = tileStore.getTileCoordUrl(new ol.TileCoord(6, 33, -87));
  assertUndefined(tileUrl);

  tileUrl = tileStore.getTileCoordUrl(new ol.TileCoord(6, 33, -23));
  assertEquals('6/33/22', tileUrl);

  tileUrl = tileStore.getTileCoordUrl(new ol.TileCoord(6, 33, 41));
  assertUndefined(tileUrl);

}
