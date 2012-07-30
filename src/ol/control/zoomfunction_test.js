goog.require('goog.testing.jsunit');
goog.require('ol.control.ZoomFunction');


function testSnapToResolutionsZero() {
  var zoomFunction =
      ol.control.ZoomFunction.createSnapToResolutions([1000, 500, 250, 100]);
  assertEquals(1000, zoomFunction(1000, 0));
  assertEquals(500, zoomFunction(500, 0));
  assertEquals(250, zoomFunction(250, 0));
  assertEquals(100, zoomFunction(100, 0));
}


function testSnapToResolutionsZoomIn() {
  var zoomFunction =
      ol.control.ZoomFunction.createSnapToResolutions([1000, 500, 250, 100]);
  assertEquals(500, zoomFunction(1000, 1));
  assertEquals(250, zoomFunction(500, 1));
  assertEquals(100, zoomFunction(250, 1));
  assertEquals(100, zoomFunction(100, 1));
}


function testSnapToResolutionsZoomOut() {
  var zoomFunction =
      ol.control.ZoomFunction.createSnapToResolutions([1000, 500, 250, 100]);
  assertEquals(1000, zoomFunction(1000, -1));
  assertEquals(1000, zoomFunction(500, -1));
  assertEquals(500, zoomFunction(250, -1));
  assertEquals(250, zoomFunction(100, -1));
}


function testSnapToResolutionsNearestZero() {
  var zoomFunction =
      ol.control.ZoomFunction.createSnapToResolutions([1000, 500, 250, 100]);
  assertEquals(1000, zoomFunction(1050, 0));
  assertEquals(1000, zoomFunction(950, 0));
  assertEquals(500, zoomFunction(550, 0));
  assertEquals(500, zoomFunction(400, 0));
  assertEquals(250, zoomFunction(300, 0));
  assertEquals(250, zoomFunction(200, 0));
  assertEquals(100, zoomFunction(150, 0));
  assertEquals(100, zoomFunction(50, 0));
}


function testSnapToResolutionsNearestZoomIn() {
  var zoomFunction =
      ol.control.ZoomFunction.createSnapToResolutions([1000, 500, 250, 100]);
  assertEquals(500, zoomFunction(1050, 1));
  assertEquals(500, zoomFunction(950, 1));
  assertEquals(250, zoomFunction(550, 1));
  assertEquals(250, zoomFunction(450, 1));
  assertEquals(100, zoomFunction(300, 1));
  assertEquals(100, zoomFunction(200, 1));
  assertEquals(100, zoomFunction(150, 1));
  assertEquals(100, zoomFunction(50, 1));
}


function testSnapToResolutionsNearestZoomOut() {
  var zoomFunction =
      ol.control.ZoomFunction.createSnapToResolutions([1000, 500, 250, 100]);
  assertEquals(1000, zoomFunction(1050, -1));
  assertEquals(1000, zoomFunction(950, -1));
  assertEquals(1000, zoomFunction(550, -1));
  assertEquals(1000, zoomFunction(450, -1));
  assertEquals(500, zoomFunction(300, -1));
  assertEquals(500, zoomFunction(200, -1));
  assertEquals(250, zoomFunction(150, -1));
  assertEquals(250, zoomFunction(50, -1));
}


function testSnapToPowerZero() {
  var zoomFunction = ol.control.ZoomFunction.createSnapToPower(2, 1024, 10);
  assertEquals(1024, zoomFunction(1024, 0));
  assertEquals(512, zoomFunction(512, 0));
  assertEquals(256, zoomFunction(256, 0));
  assertEquals(128, zoomFunction(128, 0));
  assertEquals(64, zoomFunction(64, 0));
  assertEquals(32, zoomFunction(32, 0));
  assertEquals(16, zoomFunction(16, 0));
  assertEquals(8, zoomFunction(8, 0));
  assertEquals(4, zoomFunction(4, 0));
  assertEquals(2, zoomFunction(2, 0));
  assertEquals(1, zoomFunction(1, 0));
}


function testSnapToPowerZoomIn() {
  var zoomFunction = ol.control.ZoomFunction.createSnapToPower(2, 1024, 10);
  assertEquals(512, zoomFunction(1024, 1));
  assertEquals(256, zoomFunction(512, 1));
  assertEquals(128, zoomFunction(256, 1));
  assertEquals(64, zoomFunction(128, 1));
  assertEquals(32, zoomFunction(64, 1));
  assertEquals(16, zoomFunction(32, 1));
  assertEquals(8, zoomFunction(16, 1));
  assertEquals(4, zoomFunction(8, 1));
  assertEquals(2, zoomFunction(4, 1));
  assertEquals(1, zoomFunction(2, 1));
  assertEquals(1, zoomFunction(1, 1));
}


function testSnapToPowerZoomOut() {
  var zoomFunction = ol.control.ZoomFunction.createSnapToPower(2, 1024, 10);
  assertEquals(1024, zoomFunction(1024, -1));
  assertEquals(1024, zoomFunction(512, -1));
  assertEquals(512, zoomFunction(256, -1));
  assertEquals(256, zoomFunction(128, -1));
  assertEquals(128, zoomFunction(64, -1));
  assertEquals(64, zoomFunction(32, -1));
  assertEquals(32, zoomFunction(16, -1));
  assertEquals(16, zoomFunction(8, -1));
  assertEquals(8, zoomFunction(4, -1));
  assertEquals(4, zoomFunction(2, -1));
  assertEquals(2, zoomFunction(1, -1));
}


function testSnapToPowerNearestZero() {
  var zoomFunction = ol.control.ZoomFunction.createSnapToPower(2, 1024, 10);
  assertEquals(1024, zoomFunction(1050, 0));
  assertEquals(1024, zoomFunction(9050, 0));
  assertEquals(512, zoomFunction(550, 0));
  assertEquals(512, zoomFunction(450, 0));
  assertEquals(256, zoomFunction(300, 0));
  assertEquals(256, zoomFunction(250, 0));
  assertEquals(128, zoomFunction(150, 0));
  assertEquals(128, zoomFunction(100, 0));
  assertEquals(64, zoomFunction(75, 0));
  assertEquals(64, zoomFunction(50, 0));
  assertEquals(32, zoomFunction(40, 0));
  assertEquals(32, zoomFunction(30, 0));
  assertEquals(16, zoomFunction(20, 0));
  assertEquals(16, zoomFunction(12, 0));
  assertEquals(8, zoomFunction(9, 0));
  assertEquals(8, zoomFunction(7, 0));
  assertEquals(4, zoomFunction(5, 0));
  assertEquals(4, zoomFunction(3.5, 0));
  assertEquals(2, zoomFunction(2.1, 0));
  assertEquals(2, zoomFunction(1.9, 0));
  assertEquals(1, zoomFunction(1.1, 0));
  assertEquals(1, zoomFunction(0.9, 0));
}
