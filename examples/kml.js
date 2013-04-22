goog.require('ol.Collection');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.layer.Vector');
goog.require('ol.parser.KML');
goog.require('ol.projection');
goog.require('ol.source.TiledWMS');
goog.require('ol.source.Vector');

var raster = new ol.layer.TileLayer({
  source: new ol.source.TiledWMS({
    url: 'http://vmap0.tiles.osgeo.org/wms/vmap0',
    crossOrigin: null,
    params: {
      'LAYERS': 'basic',
      'VERSION': '1.1.1',
      'FORMAT': 'image/jpeg'
    }
  })
});

var epsg4326 = ol.projection.get('EPSG:4326');

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    projection: epsg4326
  })
});

var map = new ol.Map({
  layers: new ol.Collection([raster, vector]),
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    projection: epsg4326,
    center: [-112.169, 36.099],
    zoom: 11
  })
});

var kml = new ol.parser.KML({
  maxDepth: 1, dimension: 2, extractStyles: true, extractAttributes: true});

var url = 'data/kml/lines.kml';
var xhr = new XMLHttpRequest();
xhr.open('GET', url, true);


/**
 * onload handler for the XHR request.
 */
xhr.onload = function() {
  if (xhr.status == 200) {
    // this is silly to have to tell the layer the destination projection
    var projection = map.getView().getProjection();
    vector.parseFeatures(xhr.responseText, kml, epsg4326);
  }
};
xhr.send();
