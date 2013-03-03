goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');
goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.projection');
goog.require('ol.source.TiledWMS');


if (goog.DEBUG) {
  goog.debug.Console.autoInstall();
  goog.debug.Logger.getLogger('ol').setLevel(goog.debug.Logger.Level.INFO);
}

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
  target: 'map',
  view: new ol.View2D({
    projection: epsg4326,
    center: new ol.Coordinate(0, 0),
    zoom: 2
  })
});
