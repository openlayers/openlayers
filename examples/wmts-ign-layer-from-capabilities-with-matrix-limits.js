goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.WMTSCapabilities');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');
goog.require('ol.source.WMTS');

var parser = new ol.format.WMTSCapabilities();
var map;

$.ajax('http://wxs.ign.fr/2mqbg0z6cx7ube8gsou10nrt/wmts?Service=WMTS&request' +
    '=GetCapabilities').then(function(response) {
  var result = parser.read(response);
  var options = ol.source.WMTS.optionsFromCapabilities(result,
      {layer: 'ORTHOIMAGERY.ORTHOPHOTOS', matrixSet: 'EPSG:3857'});
  options.crossOrigin = 'anonymous';

  map = new ol.Map({
    layers: [
      /*new ol.layer.Tile({
        source: new ol.source.OSM(),
        opacity: 0.7
      }),*/
      new ol.layer.Tile({
        opacity: 1,
        source: new ol.source.WMTS(options)
      })
    ],
    renderer: 'webgl',
    target: 'map',
    view: new ol.View({
      center: [261465.47, 6250023.51],
      zoom: 19
    })
  });
});
