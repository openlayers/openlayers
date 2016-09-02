goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.WMTSCapabilities');
goog.require('ol.has');
goog.require('ol.layer.Tile');
goog.require('ol.source.WMTS');


var capabilitiesUrl = 'https://www.basemap.at/wmts/1.0.0/WMTSCapabilities.xml';

// HiDPI support:
// * Use 'bmaphidpi' layer (pixel ratio 2) for device pixel ratio > 1
// * Use 'geolandbasemap' layer (pixel ratio 1) for device pixel ratio == 1
var hiDPI = ol.has.DEVICE_PIXEL_RATIO > 1;
var layer = hiDPI ? 'bmaphidpi' : 'geolandbasemap';
var tilePixelRatio = hiDPI ? 2 : 1;

var map = new ol.Map({
  target: 'map',
  view: new ol.View({
    center: [1823849, 6143760],
    zoom: 11
  })
});

fetch(capabilitiesUrl).then(function(response) {
  return response.text();
}).then(function(text) {
  var result = new ol.format.WMTSCapabilities().read(text);
  var options = ol.source.WMTS.optionsFromCapabilities(result, {
    layer: layer,
    matrixSet: 'google3857',
    style: 'normal'
  });
  options.tilePixelRatio = tilePixelRatio;
  map.addLayer(new ol.layer.Tile({
    source: new ol.source.WMTS(options)
  }));
});
