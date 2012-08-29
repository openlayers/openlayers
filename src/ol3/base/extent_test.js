goog.require('goog.testing.jsunit');
goog.require('ol3.Extent');
goog.require('ol3.Projection');


function testClone() {
  var extent = new ol3.Extent(1, 2, 3, 4);
  var clonedExtent = extent.clone();
  assertTrue(clonedExtent instanceof ol3.Extent);
  assertFalse(clonedExtent === extent);
  assertEquals(extent.minX, clonedExtent.minX);
  assertEquals(extent.minY, clonedExtent.minY);
  assertEquals(extent.maxX, clonedExtent.maxX);
  assertEquals(extent.maxY, clonedExtent.maxY);
}


function testTransform() {
  var transformFn =
      ol3.Projection.getTransformFromCodes('EPSG:4326', 'EPSG:3857');
  var sourceExtent = new ol3.Extent(-15, -30, 45, 60);
  var destinationExtent = sourceExtent.transform(transformFn);
  assertNotNullNorUndefined(destinationExtent);
  // FIXME check values with third-party tool
  assertRoughlyEquals(-1669792.3618991037, destinationExtent.minX, 1e-9);
  assertRoughlyEquals(-3503549.843504376, destinationExtent.minY, 1e-9);
  assertRoughlyEquals(5009377.085697311, destinationExtent.maxX, 1e-9);
  assertRoughlyEquals(8399737.889818361, destinationExtent.maxY, 1e-9);
}
