goog.require('goog.testing.jsunit');
goog.require('ol.control.ResolutionConstraint');


function testSnapToResolutionsZero() {
  var resolutionConstraint =
      ol.control.ResolutionConstraint.createSnapToResolutions(
          [1000, 500, 250, 100]);
  assertEquals(1000, resolutionConstraint(1000, 0));
  assertEquals(500, resolutionConstraint(500, 0));
  assertEquals(250, resolutionConstraint(250, 0));
  assertEquals(100, resolutionConstraint(100, 0));
}


function testSnapToResolutionsZoomIn() {
  var resolutionConstraint =
      ol.control.ResolutionConstraint.createSnapToResolutions(
          [1000, 500, 250, 100]);
  assertEquals(500, resolutionConstraint(1000, 1));
  assertEquals(250, resolutionConstraint(500, 1));
  assertEquals(100, resolutionConstraint(250, 1));
  assertEquals(100, resolutionConstraint(100, 1));
}


function testSnapToResolutionsZoomOut() {
  var resolutionConstraint =
      ol.control.ResolutionConstraint.createSnapToResolutions(
          [1000, 500, 250, 100]);
  assertEquals(1000, resolutionConstraint(1000, -1));
  assertEquals(1000, resolutionConstraint(500, -1));
  assertEquals(500, resolutionConstraint(250, -1));
  assertEquals(250, resolutionConstraint(100, -1));
}


function testSnapToResolutionsNearestZero() {
  var resolutionConstraint =
      ol.control.ResolutionConstraint.createSnapToResolutions(
          [1000, 500, 250, 100]);
  assertEquals(1000, resolutionConstraint(1050, 0));
  assertEquals(1000, resolutionConstraint(950, 0));
  assertEquals(500, resolutionConstraint(550, 0));
  assertEquals(500, resolutionConstraint(400, 0));
  assertEquals(250, resolutionConstraint(300, 0));
  assertEquals(250, resolutionConstraint(200, 0));
  assertEquals(100, resolutionConstraint(150, 0));
  assertEquals(100, resolutionConstraint(50, 0));
}


function testSnapToResolutionsNearestZoomIn() {
  var resolutionConstraint =
      ol.control.ResolutionConstraint.createSnapToResolutions(
          [1000, 500, 250, 100]);
  assertEquals(500, resolutionConstraint(1050, 1));
  assertEquals(500, resolutionConstraint(950, 1));
  assertEquals(250, resolutionConstraint(550, 1));
  assertEquals(250, resolutionConstraint(450, 1));
  assertEquals(100, resolutionConstraint(300, 1));
  assertEquals(100, resolutionConstraint(200, 1));
  assertEquals(100, resolutionConstraint(150, 1));
  assertEquals(100, resolutionConstraint(50, 1));
}


function testSnapToResolutionsNearestZoomOut() {
  var resolutionConstraint =
      ol.control.ResolutionConstraint.createSnapToResolutions(
          [1000, 500, 250, 100]);
  assertEquals(1000, resolutionConstraint(1050, -1));
  assertEquals(1000, resolutionConstraint(950, -1));
  assertEquals(1000, resolutionConstraint(550, -1));
  assertEquals(1000, resolutionConstraint(450, -1));
  assertEquals(500, resolutionConstraint(300, -1));
  assertEquals(500, resolutionConstraint(200, -1));
  assertEquals(250, resolutionConstraint(150, -1));
  assertEquals(250, resolutionConstraint(50, -1));
}


function testSnapToPowerZero() {
  var resolutionConstraint =
      ol.control.ResolutionConstraint.createSnapToPower(2, 1024, 10);
  assertEquals(1024, resolutionConstraint(1024, 0));
  assertEquals(512, resolutionConstraint(512, 0));
  assertEquals(256, resolutionConstraint(256, 0));
  assertEquals(128, resolutionConstraint(128, 0));
  assertEquals(64, resolutionConstraint(64, 0));
  assertEquals(32, resolutionConstraint(32, 0));
  assertEquals(16, resolutionConstraint(16, 0));
  assertEquals(8, resolutionConstraint(8, 0));
  assertEquals(4, resolutionConstraint(4, 0));
  assertEquals(2, resolutionConstraint(2, 0));
  assertEquals(1, resolutionConstraint(1, 0));
}


function testSnapToPowerZoomIn() {
  var resolutionConstraint =
      ol.control.ResolutionConstraint.createSnapToPower(2, 1024, 10);
  assertEquals(512, resolutionConstraint(1024, 1));
  assertEquals(256, resolutionConstraint(512, 1));
  assertEquals(128, resolutionConstraint(256, 1));
  assertEquals(64, resolutionConstraint(128, 1));
  assertEquals(32, resolutionConstraint(64, 1));
  assertEquals(16, resolutionConstraint(32, 1));
  assertEquals(8, resolutionConstraint(16, 1));
  assertEquals(4, resolutionConstraint(8, 1));
  assertEquals(2, resolutionConstraint(4, 1));
  assertEquals(1, resolutionConstraint(2, 1));
  assertEquals(1, resolutionConstraint(1, 1));
}


function testSnapToPowerZoomOut() {
  var resolutionConstraint =
      ol.control.ResolutionConstraint.createSnapToPower(2, 1024, 10);
  assertEquals(1024, resolutionConstraint(1024, -1));
  assertEquals(1024, resolutionConstraint(512, -1));
  assertEquals(512, resolutionConstraint(256, -1));
  assertEquals(256, resolutionConstraint(128, -1));
  assertEquals(128, resolutionConstraint(64, -1));
  assertEquals(64, resolutionConstraint(32, -1));
  assertEquals(32, resolutionConstraint(16, -1));
  assertEquals(16, resolutionConstraint(8, -1));
  assertEquals(8, resolutionConstraint(4, -1));
  assertEquals(4, resolutionConstraint(2, -1));
  assertEquals(2, resolutionConstraint(1, -1));
}


function testSnapToPowerNearestZero() {
  var resolutionConstraint =
      ol.control.ResolutionConstraint.createSnapToPower(2, 1024, 10);
  assertEquals(1024, resolutionConstraint(1050, 0));
  assertEquals(1024, resolutionConstraint(9050, 0));
  assertEquals(512, resolutionConstraint(550, 0));
  assertEquals(512, resolutionConstraint(450, 0));
  assertEquals(256, resolutionConstraint(300, 0));
  assertEquals(256, resolutionConstraint(250, 0));
  assertEquals(128, resolutionConstraint(150, 0));
  assertEquals(128, resolutionConstraint(100, 0));
  assertEquals(64, resolutionConstraint(75, 0));
  assertEquals(64, resolutionConstraint(50, 0));
  assertEquals(32, resolutionConstraint(40, 0));
  assertEquals(32, resolutionConstraint(30, 0));
  assertEquals(16, resolutionConstraint(20, 0));
  assertEquals(16, resolutionConstraint(12, 0));
  assertEquals(8, resolutionConstraint(9, 0));
  assertEquals(8, resolutionConstraint(7, 0));
  assertEquals(4, resolutionConstraint(5, 0));
  assertEquals(4, resolutionConstraint(3.5, 0));
  assertEquals(2, resolutionConstraint(2.1, 0));
  assertEquals(2, resolutionConstraint(1.9, 0));
  assertEquals(1, resolutionConstraint(1.1, 0));
  assertEquals(1, resolutionConstraint(0.9, 0));
}
