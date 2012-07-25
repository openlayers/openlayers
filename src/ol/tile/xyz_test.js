goog.require('goog.testing.jsunit');
goog.require('ol.Coordinate');
goog.require('ol.TileCoord');
goog.require('ol.TileUrlFunction');
goog.require('ol.tilestore.XYZ');


function testXYZ() {

  var xyzTileStore = new ol.tilestore.XYZ(
      6, ol.TileUrlFunction.createFromTemplate('{z}/{x}/{y}'));
  var tileGrid = xyzTileStore.getTileGrid();

  var coordinate = new ol.Coordinate(829330.2064098881, 5933916.615134273);
  var tileUrl;

  tileUrl = xyzTileStore.getTileCoordUrl(
      tileGrid.getTileCoordForCoordAndZ(coordinate, 0));
  assertEquals('0/0/0', tileUrl);

  tileUrl = xyzTileStore.getTileCoordUrl(
      tileGrid.getTileCoordForCoordAndZ(coordinate, 1));
  assertEquals('1/1/0', tileUrl);

  tileUrl = xyzTileStore.getTileCoordUrl(
      tileGrid.getTileCoordForCoordAndZ(coordinate, 2));
  assertEquals('2/2/1', tileUrl);

  tileUrl = xyzTileStore.getTileCoordUrl(
      tileGrid.getTileCoordForCoordAndZ(coordinate, 3));
  assertEquals('3/4/2', tileUrl);

  tileUrl = xyzTileStore.getTileCoordUrl(
      tileGrid.getTileCoordForCoordAndZ(coordinate, 4));
  assertEquals('4/8/5', tileUrl);

  tileUrl = xyzTileStore.getTileCoordUrl(
      tileGrid.getTileCoordForCoordAndZ(coordinate, 5));
  assertEquals('5/16/11', tileUrl);

  tileUrl = xyzTileStore.getTileCoordUrl(
      tileGrid.getTileCoordForCoordAndZ(coordinate, 6));
  assertEquals('6/33/22', tileUrl);

}


function testXYZWrapX() {

  var xyzTileStore = new ol.tilestore.XYZ(
      6, ol.TileUrlFunction.createFromTemplate('{z}/{x}/{y}'));

  tileUrl = xyzTileStore.getTileCoordUrl(new ol.TileCoord(6, -31, -23));
  assertEquals('6/33/22', tileUrl);

  tileUrl = xyzTileStore.getTileCoordUrl(new ol.TileCoord(6, 33, -23));
  assertEquals('6/33/22', tileUrl);

  tileUrl = xyzTileStore.getTileCoordUrl(new ol.TileCoord(6, 97, -23));
  assertEquals('6/33/22', tileUrl);

}


function testXYZCropY() {

  var xyzTileStore = new ol.tilestore.XYZ(
      6, ol.TileUrlFunction.createFromTemplate('{z}/{x}/{y}'));

  tileUrl = xyzTileStore.getTileCoordUrl(new ol.TileCoord(6, 33, -87));
  assertUndefined(tileUrl);

  tileUrl = xyzTileStore.getTileCoordUrl(new ol.TileCoord(6, 33, -23));
  assertEquals('6/33/22', tileUrl);

  tileUrl = xyzTileStore.getTileCoordUrl(new ol.TileCoord(6, 33, 41));
  assertUndefined(tileUrl);

}
