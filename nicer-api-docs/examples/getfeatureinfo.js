var wmsSource = new ol.source.TileWMS({
  url: 'http://demo.opengeo.org/geoserver/wms',
  params: {'LAYERS': 'ne:ne'}
});

var wmsLayer = new ol.layer.Tile({
  source: wmsSource
});

var view = new ol.View2D({
  center: [0, 0],
  zoom: 1
});

var viewProjection = /** @type {ol.proj.Projection} */
    (view.getProjection());

var map = new ol.Map({
  layers: [wmsLayer],
  target: 'map',
  view: view
});

map.on('singleclick', function(evt) {
  document.getElementById('info').innerHTML = '';
  var viewResolution = /** @type {number} */ (view.getResolution());
  var url = wmsSource.getGetFeatureInfoUrl(
      evt.coordinate, viewResolution, viewProjection,
      {'INFO_FORMAT': 'text/html'});
  if (url) {
    document.getElementById('info').innerHTML =
        '<iframe seamless src="' + url + '"></iframe>';
  }
});
