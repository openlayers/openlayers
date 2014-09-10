goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.TileWMS');


var wmsSource = new ol.source.TileWMS({
  url: 'http://demo.opengeo.org/geoserver/wms',
  params: {'LAYERS': 'ne:ne'},
  serverType: 'geoserver'
});

var wmsLayer = new ol.layer.Tile({
  source: wmsSource
});

var view = new ol.View({
  center: [0, 0],
  zoom: 1
});

var map = new ol.Map({
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
