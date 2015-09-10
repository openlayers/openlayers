var capabilitiesUrl = 'http://www.basemap.at/wmts/1.0.0/WMTSCapabilities.xml';

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

$.ajax(capabilitiesUrl).then(function(response) {
  var result = new ol.format.WMTSCapabilities().read(response);
  var options = ol.source.WMTS.optionsFromCapabilities(result, {
    layer: layer,
    matrixSet: 'google3857',
    requestEncoding: 'REST',
    style: 'normal'
  });
  options.tilePixelRatio = tilePixelRatio;
  map.addLayer(new ol.layer.Tile({
    source: new ol.source.WMTS(options)
  }));
});
