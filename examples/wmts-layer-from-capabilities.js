goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.WMTSCapabilities');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');
goog.require('ol.source.WMTS');

var parser = new ol.format.WMTSCapabilities();
var map;

fetch('data/WMTSCapabilities.xml').then(function(response) {
  return response.text();
}).then(function(text) {
  var result = parser.read(text);
  var options = ol.source.WMTS.optionsFromCapabilities(result,
      {layer: 'layer-7328', matrixSet: 'EPSG:3857'});

  map = new ol.Map({
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM(),
        opacity: 0.7
      }),
      new ol.layer.Tile({
        opacity: 1,
        source: new ol.source.WMTS(options)
      })
    ],
    target: 'map',
    view: new ol.View({
      center: [19412406.33, -5050500.21],
      zoom: 5
    })
  });
});
