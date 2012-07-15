goog.require('goog.testing.jsunit');
goog.require('ol.TileStore.createOpenStreetMap');


function testOpenStreetMap() {

  var tileStore = ol.TileStore.createOpenStreetMap(8);
  var tileGrid = tileStore.getTileGrid();

  var coordinate =
      new goog.math.Coordinate(829330.2064098881, 5933916.615134273);
  var tileUrl;

  var getTileCoordPart = function(tileUrl) {
    return tileUrl.substr(32, tileUrl.length - 36);
  };

  tileUrl = tileStore.getTileCoordUrl(tileGrid.getTileCoord(0, coordinate));
  assertEquals('0/0/0', getTileCoordPart(tileUrl));

  tileUrl = tileStore.getTileCoordUrl(tileGrid.getTileCoord(1, coordinate));
  assertEquals('1/1/0', getTileCoordPart(tileUrl));

  tileUrl = tileStore.getTileCoordUrl(tileGrid.getTileCoord(2, coordinate));
  assertEquals('2/2/1', getTileCoordPart(tileUrl));

  tileUrl = tileStore.getTileCoordUrl(tileGrid.getTileCoord(3, coordinate));
  assertEquals('3/4/2', getTileCoordPart(tileUrl));

  tileUrl = tileStore.getTileCoordUrl(tileGrid.getTileCoord(4, coordinate));
  assertEquals('4/8/5', getTileCoordPart(tileUrl));

  tileUrl = tileStore.getTileCoordUrl(tileGrid.getTileCoord(5, coordinate));
  assertEquals('5/16/11', getTileCoordPart(tileUrl));

  tileUrl = tileStore.getTileCoordUrl(tileGrid.getTileCoord(6, coordinate));
  assertEquals('6/33/22', getTileCoordPart(tileUrl));

}
