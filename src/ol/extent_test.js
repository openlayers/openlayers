goog.require('goog.testing.jsunit');
goog.require('ol.Extent');
goog.require('ol.Projection');


function testTransform() {
  var transform = ol.Projection.getTransformFromCodes('EPSG:4326', 'EPSG:3857');
  var sourceExtent = new ol.Extent(60, 45, -30, -15);
  var destinationExtent = sourceExtent.transform(transform);
  assertNotNullNorUndefined(destinationExtent);
  // FIXME check values with third-party tool
  assertRoughlyEquals(8399737.889818361, destinationExtent.top, 1e-9);
  assertRoughlyEquals(5009377.085697311, destinationExtent.right, 1e-9);
  assertRoughlyEquals(-3503549.843504376, destinationExtent.bottom, 1e-9);
  assertRoughlyEquals(-1669792.3618991037, destinationExtent.left, 1e-9);
}
