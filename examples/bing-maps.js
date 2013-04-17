goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.projection');
goog.require('ol.source.BingMaps');


var styles = ['Road', 'Aerial', 'AerialWithLabels'];
var layers = [];
for (var i = 0; i < styles.length; ++i) {
  layers.push(new ol.layer.TileLayer({
    visible: false,
    preload: Infinity,
    source: new ol.source.BingMaps({
      key: 'AlQLZ0-5yk301_ESrmNLma3LYxEKNSg7w-e_knuRfyYFtld-UFvXVs38NOulku3Q',
      style: styles[i]
    })
  }));
}
var map = new ol.Map({
  layers: layers,
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    center: ol.projection.transform([-123.1, 49.25], 'EPSG:4326', 'EPSG:3857'),
    zoom: 8
  })
});

$('#layer-select').change(function() {
  var style = $(this).find(':selected').val();
  for (var i = 0; i < layers.length; ++i) {
    layers[i].setVisible(styles[i] == style);
  }
});
$('#layer-select').trigger('change');
