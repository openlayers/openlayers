goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.testing.jsunit');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.Projection');
goog.require('ol.TileGrid');
goog.require('ol.TileLayer');
goog.require('ol.TileStore');
goog.require('ol.TileUrlFunction');
goog.require('ol.dom.Map');
goog.require('ol.dom.TileLayerRenderer');


var tileLayerRenderer;


function setUp() {
  var map = new ol.dom.Map(
      goog.dom.createElement(goog.dom.TagName.DIV));

  var resolutions = [100, 80, 50, 10, 1, 0.1];
  var extent = new ol.Extent(0, 0, 100000, 100000);
  var origin = new ol.Coordinate(0, 0);
  var tileGrid = new ol.TileGrid(resolutions, extent, origin);

  var projection = ol.Projection.getFromCode('EPSG:3857');
  var tileUrlFunction = ol.TileUrlFunction.createFromTemplate('{z}/{x}/{y}');
  var tileStore = new ol.TileStore(projection, tileGrid, tileUrlFunction);

  var tileLayer = new ol.TileLayer(tileStore);

  tileLayerRenderer = new ol.dom.TileLayerRenderer(
      map, tileLayer,
      goog.dom.createElement(goog.dom.TagName.DIV));
}


function testGetPreferredZ() {

  var z;

  // gets the max resolution.
  z = tileLayerRenderer.getPreferredZ_(100);
  assertEquals(0, z);

  // gets the min resolution.
  z = tileLayerRenderer.getPreferredZ_(0.1);
  assertEquals(5, z);

  // gets the max when bigger.
  z = tileLayerRenderer.getPreferredZ_(200);
  assertEquals(0, z);

  // gets the min when smaller.
  z = tileLayerRenderer.getPreferredZ_(0.01);
  assertEquals(5, z);

  // gets the first when in the middle.
  z = tileLayerRenderer.getPreferredZ_(90);
  assertEquals(0, z);

  // gets the closer when elsewhere.

  z = tileLayerRenderer.getPreferredZ_(89);
  assertEquals(1, z);

  z = tileLayerRenderer.getPreferredZ_(49);
  assertEquals(2, z);

  z = tileLayerRenderer.getPreferredZ_(0.5);
  assertEquals(5, z);
}
