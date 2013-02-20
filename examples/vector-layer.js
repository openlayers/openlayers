goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.Projection');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.layer.TileLayer');
goog.require('ol.layer.Vector');
goog.require('ol.source.MapQuestOpenAerial');
goog.require('ol.source.Vector');


var raster = new ol.layer.TileLayer({
  source: new ol.source.MapQuestOpenAerial()
});

var source = new ol.source.Vector({
  projection: ol.Projection.getFromCode('EPSG:3857')
});

source.addFeatures([
  new ol.Feature({
    g: new ol.geom.LineString([[-10000000, -10000000], [10000000, 10000000]])
  }),
  new ol.Feature({
    g: new ol.geom.LineString([[-10000000, 10000000], [10000000, -10000000]])
  }),
  new ol.Feature({g: new ol.geom.Point([-10000000, 5000000])})
]);

var vector = new ol.layer.Vector({
  source: source
});

var map = new ol.Map({
  layers: new ol.Collection([raster, vector]),
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: new ol.Coordinate(0, 0),
    zoom: 0
  })
});
