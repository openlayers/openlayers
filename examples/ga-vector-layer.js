goog.require('ga.Map');
goog.require('ga.layer');
goog.require('ol.View');
goog.require('ol.layer.Vector');
goog.require('ol.format.GeoJSON');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'data/cities.geojson',
    format: new ol.format.GeoJSON(),
    projection: 'EPSG:21781'
  }),
  style: function(feature, resolution) {
    var text = resolution < 251 ? feature.get('NAME') : '';
    var style = new ol.style.Style({
      image: new ol.style.Circle({
        fill: new ol.style.Fill({
          color: [255, 255, 255, 0.6]
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3'
        })
      }),
      fill: new ol.style.Fill({
        color: [255, 255, 255, 0.6]
      }),
      stroke: new ol.style.Stroke({
        color: '#319FD3',
        width: 1
      }),
      text: new ol.style.Text({
        text: text,
        font: '12px Calibri,sans-serif',
        fill: new ol.style.Fill({
          color: '#000'
        }),
        stroke: new ol.style.Stroke({
          color: 'white',
          width: 3
        })
      })
    });
    return [style];
  }
});

// Create a GeoAdmin Map
var map = new ga.Map({
  // Add GeoAdmin layers
  layers: [
    ga.layer.create('ch.swisstopo.swisstlm3d-karte-farbe'),
    vector
  ],
  // Define the div where the map is placed
  target: 'map',
  // Create a 2D view
  view: new ol.View({
    // Define the default resolution
    // 10 means that one pixel is 10m width and height
    // List of resolution of the WMTS layers:
    // 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1, 0.5, 0.25, 0.1
    resolution: 500
  })
});

var displayFeatureInfo = function(pixel) {
  var feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
    return feature;
  });
  if (feature) {
    document.getElementById('info').innerHTML =
        feature.get('NAME') + ' - inhabitants: ' +
        feature.get('EINWOHNERZ') +
        '&nbsp;';
  }
};

$(map.getViewport()).on('mousemove', function(evt) {
  var pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('singleclick', function(evt) {
  var pixel = evt.pixel;
  displayFeatureInfo(pixel);
});
