goog.require('goog.testing.jsunit');
goog.require('ol.Coordinate');
goog.require('ol.Rectangle');


function testCenter() {
  var rectangle = new ol.Rectangle(1, 2, 3, 4);
  var center = rectangle.getCenter();
  assertEquals(2, center.x);
  assertEquals(3, center.y);
}


function testContainsPositive() {
  var rectangle = new ol.Rectangle(1, 2, 3, 4);
  assertTrue(rectangle.contains(new ol.Coordinate(1, 2)));
  assertTrue(rectangle.contains(new ol.Coordinate(1, 3)));
  assertTrue(rectangle.contains(new ol.Coordinate(1, 4)));
  assertTrue(rectangle.contains(new ol.Coordinate(2, 2)));
  assertTrue(rectangle.contains(new ol.Coordinate(2, 3)));
  assertTrue(rectangle.contains(new ol.Coordinate(2, 4)));
  assertTrue(rectangle.contains(new ol.Coordinate(3, 2)));
  assertTrue(rectangle.contains(new ol.Coordinate(3, 3)));
  assertTrue(rectangle.contains(new ol.Coordinate(3, 4)));
}


function testContainsNegative() {
  var rectangle = new ol.Rectangle(1, 2, 3, 4);
  assertFalse(rectangle.contains(new ol.Coordinate(0, 1)));
  assertFalse(rectangle.contains(new ol.Coordinate(0, 2)));
  assertFalse(rectangle.contains(new ol.Coordinate(0, 3)));
  assertFalse(rectangle.contains(new ol.Coordinate(0, 4)));
  assertFalse(rectangle.contains(new ol.Coordinate(0, 5)));
  assertFalse(rectangle.contains(new ol.Coordinate(1, 1)));
  assertFalse(rectangle.contains(new ol.Coordinate(1, 5)));
  assertFalse(rectangle.contains(new ol.Coordinate(2, 1)));
  assertFalse(rectangle.contains(new ol.Coordinate(2, 5)));
  assertFalse(rectangle.contains(new ol.Coordinate(3, 1)));
  assertFalse(rectangle.contains(new ol.Coordinate(3, 5)));
  assertFalse(rectangle.contains(new ol.Coordinate(4, 1)));
  assertFalse(rectangle.contains(new ol.Coordinate(4, 2)));
  assertFalse(rectangle.contains(new ol.Coordinate(4, 3)));
  assertFalse(rectangle.contains(new ol.Coordinate(4, 4)));
  assertFalse(rectangle.contains(new ol.Coordinate(4, 5)));
}


function testIntersects() {

  var rectangle1 = new ol.Rectangle(50, 50, 100, 100);

  function assertIntersects(rectangle2) {
    assertTrue(rectangle1 + ' expected to intersect ' + rectangle2,
        rectangle1.intersects(rectangle2));
  }
  function assertNotIntersects(rectangle2) {
    assertFalse(rectangle1 + ' expected to not intersect ' + rectangle2,
        rectangle1.intersects(rectangle2));
  }

  assertIntersects(rectangle1);
  assertIntersects(new ol.Rectangle(20, 20, 80, 80));
  assertIntersects(new ol.Rectangle(20, 50, 80, 100));
  assertIntersects(new ol.Rectangle(20, 80, 80, 120));
  assertIntersects(new ol.Rectangle(50, 20, 100, 80));
  assertIntersects(new ol.Rectangle(50, 80, 100, 120));
  assertIntersects(new ol.Rectangle(80, 20, 120, 80));
  assertIntersects(new ol.Rectangle(80, 50, 120, 100));
  assertIntersects(new ol.Rectangle(80, 80, 120, 120));
  assertIntersects(new ol.Rectangle(20, 20, 120, 120));
  assertIntersects(new ol.Rectangle(70, 70, 80, 80));
  assertNotIntersects(new ol.Rectangle(10, 10, 30, 30));
  assertNotIntersects(new ol.Rectangle(30, 10, 70, 30));
  assertNotIntersects(new ol.Rectangle(50, 10, 100, 30));
  assertNotIntersects(new ol.Rectangle(80, 10, 120, 30));
  assertNotIntersects(new ol.Rectangle(120, 10, 140, 30));
  assertNotIntersects(new ol.Rectangle(10, 30, 30, 70));
  assertNotIntersects(new ol.Rectangle(120, 30, 140, 70));
  assertNotIntersects(new ol.Rectangle(10, 50, 30, 100));
  assertNotIntersects(new ol.Rectangle(120, 50, 140, 100));
  assertNotIntersects(new ol.Rectangle(10, 80, 30, 120));
  assertNotIntersects(new ol.Rectangle(120, 80, 140, 120));
  assertNotIntersects(new ol.Rectangle(10, 120, 30, 140));
  assertNotIntersects(new ol.Rectangle(30, 120, 70, 140));
  assertNotIntersects(new ol.Rectangle(50, 120, 100, 140));
  assertNotIntersects(new ol.Rectangle(80, 120, 120, 140));
  assertNotIntersects(new ol.Rectangle(120, 120, 140, 140));
}


function testSize() {
  var rectangle = new ol.Rectangle(0, 1, 2, 4);
  var size = rectangle.getSize();
  assertEquals(2, size.width);
  assertEquals(3, size.height);
}


function testNormalize() {
  var rectangle = new ol.Rectangle(0, 1, 2, 3);
  var coordinate;

  coordinate = rectangle.normalize(new ol.Coordinate(1, 2));
  assertEquals(0.5, coordinate.x);
  assertEquals(0.5, coordinate.y);

  coordinate = rectangle.normalize(new ol.Coordinate(0, 3));
  assertEquals(0, coordinate.x);
  assertEquals(1, coordinate.y);

  coordinate = rectangle.normalize(new ol.Coordinate(2, 1));
  assertEquals(1, coordinate.x);
  assertEquals(0, coordinate.y);

  coordinate = rectangle.normalize(new ol.Coordinate(0, 0));
  assertEquals(0, coordinate.x);
  assertEquals(-0.5, coordinate.y);

  coordinate = rectangle.normalize(new ol.Coordinate(-1, 1));
  assertEquals(-0.5, coordinate.x);
  assertEquals(0, coordinate.y);

}


function testToString() {
  var rectangle = new ol.Rectangle(0, 1, 2, 3);
  assertEquals('(0, 1, 2, 3)', rectangle.toString());
}
