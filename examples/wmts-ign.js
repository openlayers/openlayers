goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.extent');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.WMTS');
goog.require('ol.tilegrid.WMTS');


var map = new ol.Map({
  target: 'map',
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: new ol.View({
    zoom: 5,
    center: ol.proj.transform([5, 45], 'EPSG:4326', 'EPSG:3857')
  })
});

var resolutions = [];
var matrixIds = [];
var proj3857 = ol.proj.get('EPSG:3857');
var maxResolution = ol.extent.getWidth(proj3857.getExtent()) / 256;

for (var i = 0; i < 18; i++) {
  matrixIds[i] = i.toString();
  resolutions[i] = maxResolution / Math.pow(2, i);
}

var tileGrid = new ol.tilegrid.WMTS({
  origin: [-20037508, 20037508],
  resolutions: resolutions,
  matrixIds: matrixIds
});

// API key valid for 'openlayers.org' and 'localhost'.
// Expiration date is 06/29/2018.
var key = '2mqbg0z6cx7ube8gsou10nrt';

var ign_source = new ol.source.WMTS({
  url: 'https://wxs.ign.fr/' + key + '/wmts',
  layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS',
  matrixSet: 'PM',
  format: 'image/jpeg',
  projection: 'EPSG:3857',
  tileGrid: tileGrid,
  style: 'normal',
  attributions: [new ol.Attribution({
    html: '<a href="http://www.geoportail.fr/" target="_blank">' +
        '<img src="http://api.ign.fr/geoportail/api/js/latest/' +
        'theme/geoportal/img/logo_gp.gif"></a>'
  })]
});

var ign = new ol.layer.Tile({
  source: ign_source
});

map.addLayer(ign);
