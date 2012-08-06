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


function testXYZTileGridForEachTileCoordParentTileBounds() {

  var xyzTileGrid = new ol.tilegrid.XYZ(6);

  var tileCoord = new ol.TileCoord(5, 11, 21);
  var zs = [], tileBoundss = [];
  xyzTileGrid.forEachTileCoordParentTileBounds(
      tileCoord,
      function(z, tileBounds) {
        zs.push(z);
        tileBoundss.push(tileBounds);
        return false;
      });

  assertEquals(5, zs.length);
  assertEquals(5, tileBoundss.length);

  assertEquals(4, zs[0]);
  assertEquals(5, tileBoundss[0].minX);
  assertEquals(10, tileBoundss[0].minY);
  assertEquals(5, tileBoundss[0].maxX);
  assertEquals(10, tileBoundss[0].maxY);

  assertEquals(3, zs[1]);
  assertEquals(2, tileBoundss[1].minX);
  assertEquals(5, tileBoundss[1].minY);
  assertEquals(2, tileBoundss[1].maxX);
  assertEquals(5, tileBoundss[1].maxY);

  assertEquals(2, zs[2]);
  assertEquals(1, tileBoundss[2].minX);
  assertEquals(2, tileBoundss[2].minY);
  assertEquals(1, tileBoundss[2].maxX);
  assertEquals(2, tileBoundss[2].maxY);

  assertEquals(1, zs[3]);
  assertEquals(0, tileBoundss[3].minX);
  assertEquals(1, tileBoundss[3].minY);
  assertEquals(0, tileBoundss[3].maxX);
  assertEquals(1, tileBoundss[3].maxY);

  assertEquals(0, zs[4]);
  assertEquals(0, tileBoundss[4].minX);
  assertEquals(0, tileBoundss[4].minY);
  assertEquals(0, tileBoundss[4].maxX);
  assertEquals(0, tileBoundss[4].maxY);

}
