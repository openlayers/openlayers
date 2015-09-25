goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.Stamen');


var stamenSource = new ol.source.Stamen({
  layer: 'watercolor'
});
var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: stamenSource
    })
  ],
  renderer: common.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View({
    center: ol.proj.transform(
        [-122.416667, 37.783333], 'EPSG:4326', 'EPSG:3857'),
    zoom: 12
  })
});


$('#source-layer-select').change(function() {
  var layer = /** @type {string} */ ($(this).find(':selected').val());
  stamenSource.setLayer(layer);
});
