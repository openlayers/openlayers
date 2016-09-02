goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Image');
goog.require('ol.source.ImageWMS');


var wmsSource = new ol.source.ImageWMS({
  url: 'http://demo.boundlessgeo.com/geoserver/wms',
  params: {'LAYERS': 'ne:ne'},
  serverType: 'geoserver',
  crossOrigin: 'anonymous'
});

var wmsLayer = new ol.layer.Image({
  source: wmsSource
});

var view = new ol.View({
  center: [0, 0],
  zoom: 1
});

var map = new ol.Map({
  renderer: common.getRendererFromQueryString(),
  layers: [wmsLayer],
  target: 'map',
  view: view
});

map.on('singleclick', function(evt) {
  document.getElementById('info').innerHTML = '';
  var viewResolution = /** @type {number} */ (view.getResolution());
  var url = wmsSource.getGetFeatureInfoUrl(
      evt.coordinate, viewResolution, 'EPSG:3857',
      {'INFO_FORMAT': 'text/html'});
  if (url) {
    document.getElementById('info').innerHTML =
        '<iframe seamless src="' + url + '"></iframe>';
  }
});

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  var pixel = map.getEventPixel(evt.originalEvent);
  var hit = map.forEachLayerAtPixel(pixel, function() {
    return true;
  });
  map.getTargetElement().style.cursor = hit ? 'pointer' : '';
});
