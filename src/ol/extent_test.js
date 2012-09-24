goog.require('goog.testing.jsunit');
goog.require('ol.Extent');
goog.require('ol.Projection');


function testContainsPositive() {
  var extent = new ol.Extent(1, 2, 3, 4);
  assertTrue(extent.contains(new ol.Coordinate(1, 2)));
  assertTrue(extent.contains(new ol.Coordinate(1, 3)));
  assertTrue(extent.contains(new ol.Coordinate(1, 4)));
  assertTrue(extent.contains(new ol.Coordinate(2, 2)));
  assertTrue(extent.contains(new ol.Coordinate(2, 3)));
  assertTrue(extent.contains(new ol.Coordinate(2, 4)));
  assertTrue(extent.contains(new ol.Coordinate(3, 2)));
  assertTrue(extent.contains(new ol.Coordinate(3, 3)));
  assertTrue(extent.contains(new ol.Coordinate(3, 4)));
}


function testContainsNegative() {
  var extent = new ol.Extent(1, 2, 3, 4);
  assertFalse(extent.contains(new ol.Coordinate(0, 1)));
  assertFalse(extent.contains(new ol.Coordinate(0, 2)));
  assertFalse(extent.contains(new ol.Coordinate(0, 3)));
  assertFalse(extent.contains(new ol.Coordinate(0, 4)));
  assertFalse(extent.contains(new ol.Coordinate(0, 5)));
  assertFalse(extent.contains(new ol.Coordinate(1, 1)));
  assertFalse(extent.contains(new ol.Coordinate(1, 5)));
  assertFalse(extent.contains(new ol.Coordinate(2, 1)));
  assertFalse(extent.contains(new ol.Coordinate(2, 5)));
  assertFalse(extent.contains(new ol.Coordinate(3, 1)));
  assertFalse(extent.contains(new ol.Coordinate(3, 5)));
  assertFalse(extent.contains(new ol.Coordinate(4, 1)));
  assertFalse(extent.contains(new ol.Coordinate(4, 2)));
  assertFalse(extent.contains(new ol.Coordinate(4, 3)));
  assertFalse(extent.contains(new ol.Coordinate(4, 4)));
  assertFalse(extent.contains(new ol.Coordinate(4, 5)));
}


function testTransform() {
  var transformFn =
      ol.Projection.getTransformFromCodes('EPSG:4326', 'EPSG:3857');
  var sourceExtent = new ol.Extent(-15, -30, 45, 60);
  var destinationExtent = sourceExtent.transform(transformFn);
  assertNotNullNorUndefined(destinationExtent);
  // FIXME check values with third-party tool
  assertRoughlyEquals(-1669792.3618991037, destinationExtent.minX, 1e-9);
  assertRoughlyEquals(-3503549.843504376, destinationExtent.minY, 1e-9);
  assertRoughlyEquals(5009377.085697311, destinationExtent.maxX, 1e-9);
  assertRoughlyEquals(8399737.889818361, destinationExtent.maxY, 1e-9);
}
