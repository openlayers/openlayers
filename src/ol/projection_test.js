goog.require('goog.array');
goog.require('goog.math.Coordinate');
goog.require('goog.testing.jsunit');
goog.require('ol.Projection');


function _testAllEquivalent(codes) {
  var projections = goog.array.map(codes, ol.Projection.createFromCode);
  goog.array.forEach(projections, function(source) {
    goog.array.forEach(projections, function(destination) {
      assertTrue(ol.Projection.equivalent(source, destination));
    });
  });
}


function testEpsg3857Equivalence() {
  _testAllEquivalent([
    'EPSG:3857',
    'EPSG:102100',
    'EPSG:102113',
    'EPSG:900913'
  ]);
}


function testEpsg4326Equivalence() {
  _testAllEquivalent([
    'CRS:84',
    'urn:ogc:def:crs:EPSG:6.6:4326',
    'EPSG:4326'
  ]);
}


function testIdentityTransform() {
  var epsg4326 = ol.Projection.createFromCode('EPSG:4326');
  var uniqueObject = {};
  var sourcePoint = new goog.math.Coordinate(uniqueObject, uniqueObject);
  var destinationPoint = ol.Projection.transform(
      sourcePoint, epsg4326, epsg4326);
  assertFalse(sourcePoint === destinationPoint);
  assertTrue(destinationPoint.x === sourcePoint.x);
  assertTrue(destinationPoint.y === sourcePoint.y);
}


function testForwardSphericalMercatorOrigin() {
  var point = ol.Projection.transformWithCodes(
      new goog.math.Coordinate(0, 0), 'EPSG:4326', 'EPSG:3857');
  assertNotNullNorUndefined(point);
  assertEquals(0, point.x);
  assertRoughlyEquals(0, point.y, 1e-9);
}


function testInverseSphericalMercatorOrigin() {
  var point = ol.Projection.transformWithCodes(
      new goog.math.Coordinate(0, 0), 'EPSG:3857', 'EPSG:4326');
  assertNotNullNorUndefined(point);
  assertEquals(0, point.x);
  assertEquals(0, point.y);
}


function testForwardSphericalMercatorAlastaira() {
  // http://alastaira.wordpress.com/2011/01/23/the-google-maps-bing-maps-spherical-mercator-projection/
  var point = ol.Projection.transformWithCodes(
      new goog.math.Coordinate(-5.625, 52.4827802220782),
      'EPSG:4326',
      'EPSG:900913');
  assertNotNullNorUndefined(point);
  assertRoughlyEquals(-626172.13571216376, point.x, 1e-9);
  assertRoughlyEquals(6887893.4928337997, point.y, 1e-9);
}


function testInverseSphericalMercatorAlastaira() {
  // http://alastaira.wordpress.com/2011/01/23/the-google-maps-bing-maps-spherical-mercator-projection/
  var point = ol.Projection.transformWithCodes(
      new goog.math.Coordinate(-626172.13571216376, 6887893.4928337997),
      'EPSG:900913',
      'EPSG:4326');
  assertNotNullNorUndefined(point);
  assertRoughlyEquals(-5.625, point.x, 1e-9);
  assertRoughlyEquals(52.4827802220782, point.y, 1e-9);
}
