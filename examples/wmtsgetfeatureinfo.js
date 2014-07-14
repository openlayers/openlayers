goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.extent');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.WMTS');
goog.require('ol.tilegrid.WMTS');

var projection = ol.proj.get('EPSG:900913');
var projectionExtent = projection.getExtent();
var size = ol.extent.getWidth(projectionExtent) / 256;
var resolutions = new Array(14);
var matrixIds = new Array(14);
for (var z = 0; z < 14; ++z) {
  // generate resolutions and matrixIds arrays for this WMTS
  resolutions[z] = size / Math.pow(2, z);
  matrixIds[z] = 'EPSG:900913:' + z;
}

var attribution = new ol.Attribution({
  html: 'Tiles &copy; <a href="http://maps.opengeo.org/geowebcache/' +
      'service/wmts">opengeo</a>'
});

var wmtsSource = new ol.source.WMTS({
  attributions: [attribution],
  extent: projectionExtent,
  layer: 'graphite',
  matrixSet: 'EPSG:900913',
  format: 'image/png',
  projection: projection,
  style: '_null',
  tileGrid: new ol.tilegrid.WMTS({
    origin: ol.extent.getTopLeft(projectionExtent),
    resolutions: resolutions,
    matrixIds: matrixIds
  }),
  url: 'http://maps.opengeo.org/geowebcache/service/wmts'
});


var wmtsLayer = new ol.layer.Tile({
  source: wmtsSource
});


var view = new ol.View({
  center: [0, 0],
  zoom: 2
});

var viewProjection = /** @type {ol.proj.Projection} */
    (view.getProjection());

var map = new ol.Map({
  layers: [wmtsLayer],
  target: 'map',
  view: view
});

map.on('singleclick', function(evt) {
  document.getElementById('info').innerHTML = '';
  var viewResolution = /** @type {number} */ (view.getResolution());
  var url = wmtsSource.getGetFeatureInfoUrl(
      evt.coordinate, viewResolution, viewProjection,
      {'INFOFORMAT': 'text/html'});
  if (url) {
    document.getElementById('info').innerHTML =
        '<iframe seamless src="' + url + '"></iframe>';
  }
});
