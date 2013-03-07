goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.layer.TileLayer');
goog.require('ol.layer.Vector');
goog.require('ol.parser.GeoJSON');
goog.require('ol.projection');
goog.require('ol.source.MapQuestOpenAerial');
goog.require('ol.source.Vector');


var raster = new ol.layer.TileLayer({
  source: new ol.source.MapQuestOpenAerial()
});

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    projection: ol.projection.getFromCode('EPSG:4326')
  })
});

var geojson = new ol.parser.GeoJSON();
var url = '../test/spec/ol/parser/geojson/countries.json';
var xhr = new XMLHttpRequest();
xhr.open('GET', url, true);


/**
 * onload handler for the XHR request.
 */
xhr.onload = function() {
  if (xhr.status == 200) {
    // this is silly to have to tell the layer the destination projection
    var projection = map.getView().getProjection();
    vector.parseFeatures(xhr.responseText, geojson, projection);
  } else {
    throw new Error('Data loading failed: ' + xhr.status);
  }
};
xhr.send();

var map = new ol.Map({
  layers: new ol.Collection([raster, vector]),
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: new ol.Coordinate(0, 0),
    zoom: 0
  })
});
