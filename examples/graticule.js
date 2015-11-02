goog.require('ol.Graticule');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.OSM');
goog.require('ol.style.Stroke');


var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  renderer: 'canvas',
  target: 'map',
  view: new ol.View({
    center: ol.proj.fromLonLat([4.8, 47.75]),
    zoom: 5
  })
});

var lonFormatter = function(lon) {
  var formattedLon = Math.abs(Math.round(lon * 100) / 100);
  formattedLon += (lon < 0) ? 'W' : ((lon > 0) ? 'E' : '');
  return formattedLon;
};

var latFormatter = function(lat) {
  var formattedLat = Math.abs(Math.round(lat * 100) / 100);
  formattedLat += (lat < 0) ? 'S' : ((lat > 0) ? 'N' : '');
  return formattedLat;
};

// Create the graticule component
var graticule = new ol.Graticule({
  // the style to use for the lines, optional.
  strokeStyle: new ol.style.Stroke({
    color: 'rgba(255,120,0,0.9)',
    width: 2,
    lineDash: [0.5, 4]
  }),
  showLabels: true,
  lonLabelFormatter: lonFormatter,
  lonLabelPosition: 0.05,
  latLabelFormatter: latFormatter,
  latLabelPosition: 0.95
});
graticule.setMap(map);
