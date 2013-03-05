goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.control.ScaleLineUnits');
goog.require('ol.layer.TileLayer');
goog.require('ol.projection');
goog.require('ol.source.TiledWMS');


var epsg4326 = ol.projection.getFromCode('EPSG:4326');

// We give the single image source a set of resolutions. This prevents the
// source from requesting images of arbitrary resolutions.
var projectionExtent = epsg4326.getExtent();
var maxResolution = Math.max(
    projectionExtent.maxX - projectionExtent.minX,
    projectionExtent.maxY - projectionExtent.minY) / 256;
var resolutions = new Array(10);
for (var i = 0; i < 10; ++i) {
  resolutions[i] = maxResolution / Math.pow(2.0, i);
}

var layers = new ol.Collection([
  new ol.layer.TileLayer({
    source: new ol.source.TiledWMS({
      url: 'http://vmap0.tiles.osgeo.org/wms/vmap0',
      crossOrigin: null,
      version: '1.1.1',
      params: {
        'LAYERS': 'basic',
        'FORMAT': 'image/jpeg'
      },
      projection: epsg4326
    })
  })
]);

var map = new ol.Map({
  layers: layers,
  // The OSgeo server does not set cross origin headers, so we cannot use WebGL
  renderers: [ol.RendererHint.CANVAS, ol.RendererHint.DOM],
  scaleLineControl: true,
  scaleLineUnits: ol.control.ScaleLineUnits.DEGREES,
  target: 'map',
  view: new ol.View2D({
    projection: epsg4326,
    center: new ol.Coordinate(0, 0),
    zoom: 2
  })
});
