goog.require('ga.Map');
goog.require('ga.layer');
goog.require('ol.View2D');
goog.require('ol.source.GeoJSON');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');

var vector = new ol.layer.Vector({
  source: new ol.source.GeoJSON({
    repojectTo: 'EPSG:21781',
    url: 'data/cities.geojson'
  }),
  styleFunction: function(feature, resolution) {
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
        color: '#319FD3'
      })
    });

    if (resolution < 50) {
      style.text = new ol.style.Text({
        color: 'black',
        text: ol.expr.parse('NAME'),
        fontFamily: 'Calibri,sans-serif',
        fontSize: 12,
        stroke: new ol.style.Stroke({
          color: 'white',
          width: 3
        })
      });
    }
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
  view: new ol.View2D({
    // Define the default resolution
    // 10 means that one pixel is 10m width and height
    // List of resolution of the WMTS layers:
    // 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1, 0.5, 0.25, 0.1
    resolution: 500
  })
});

var displayFeatureInfo = function(evt) {
  var pixel = (evt.originalEvent) ?
      map.getEventPixel(evt.originalEvent) :
      evt.getPixel();
  var features = [];
  map.forEachFeatureAtPixel(pixel, function(feature, layer) {
    if (layer === olLayer) {
      features.push(feature);
    }
  });  
  document.getElementById('info').innerHTML = features.length > 0 ?
      features[0].get('NAME') + ' - inhabitants: ' +
      features[0].get('EINWOHNERZ') :
      '&nbsp;';
};

$(map.getViewport()).on('mousemove', function(evt) {
  displayFeatureInfo(evt);
});

map.on('singleclick', function(evt) {
  displayFeatureInfo(evt);
});
