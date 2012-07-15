goog.require('goog.math.Coordinate');
goog.require('goog.testing.jsunit');
goog.require('ol.Rectangle');


function testCenter() {
  var rectangle = new ol.Rectangle(1, 2, 3, 4);
  var center = rectangle.getCenter();
  assertEquals(2, center.x);
  assertEquals(3, center.y);
}


function testClone() {
  var rectangle = new ol.Rectangle(1, 2, 3, 4);
  var clonedRectangle = rectangle.clone();
  assertTrue(clonedRectangle instanceof ol.Rectangle);
  assertFalse(clonedRectangle === rectangle);
  assertEquals(rectangle.minX, clonedRectangle.minX);
  assertEquals(rectangle.minY, clonedRectangle.minY);
  assertEquals(rectangle.maxX, clonedRectangle.maxX);
  assertEquals(rectangle.maxY, clonedRectangle.maxY);
}


function testContainsPositive() {
  var rectangle = new ol.Rectangle(1, 2, 3, 4);
  assertTrue(rectangle.contains(new goog.math.Coordinate(1, 2)));
  assertTrue(rectangle.contains(new goog.math.Coordinate(1, 3)));
  assertTrue(rectangle.contains(new goog.math.Coordinate(1, 4)));
  assertTrue(rectangle.contains(new goog.math.Coordinate(2, 2)));
  assertTrue(rectangle.contains(new goog.math.Coordinate(2, 3)));
  assertTrue(rectangle.contains(new goog.math.Coordinate(2, 4)));
  assertTrue(rectangle.contains(new goog.math.Coordinate(3, 2)));
  assertTrue(rectangle.contains(new goog.math.Coordinate(3, 3)));
  assertTrue(rectangle.contains(new goog.math.Coordinate(3, 4)));
}


function testContainsNegative() {
  var rectangle = new ol.Rectangle(1, 2, 3, 4);
  assertFalse(rectangle.contains(new goog.math.Coordinate(0, 1)));
  assertFalse(rectangle.contains(new goog.math.Coordinate(0, 2)));
  assertFalse(rectangle.contains(new goog.math.Coordinate(0, 3)));
  assertFalse(rectangle.contains(new goog.math.Coordinate(0, 4)));
  assertFalse(rectangle.contains(new goog.math.Coordinate(0, 5)));
  assertFalse(rectangle.contains(new goog.math.Coordinate(1, 1)));
  assertFalse(rectangle.contains(new goog.math.Coordinate(1, 5)));
  assertFalse(rectangle.contains(new goog.math.Coordinate(2, 1)));
  assertFalse(rectangle.contains(new goog.math.Coordinate(2, 5)));
  assertFalse(rectangle.contains(new goog.math.Coordinate(3, 1)));
  assertFalse(rectangle.contains(new goog.math.Coordinate(3, 5)));
  assertFalse(rectangle.contains(new goog.math.Coordinate(4, 1)));
  assertFalse(rectangle.contains(new goog.math.Coordinate(4, 2)));
  assertFalse(rectangle.contains(new goog.math.Coordinate(4, 3)));
  assertFalse(rectangle.contains(new goog.math.Coordinate(4, 4)));
  assertFalse(rectangle.contains(new goog.math.Coordinate(4, 5)));
}
