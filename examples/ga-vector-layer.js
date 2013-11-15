goog.require('ga.Map');
goog.require('ga.layer');
goog.require('ol.View2D');
goog.require('ol.parser.GeoJSON');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Rule');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    parser: new ol.parser.GeoJSON(),
    url: 'data/cities.geojson'
  }),
  style: new ol.style.Style({rules: [
    new ol.style.Rule({
      symbolizers: [
        new ol.style.Fill({
          color: 'white',
          opacity: 0.6
        }),
        new ol.style.Stroke({
          color: '#319FD3',
          opacity: 1
        })
      ]
    }),
    new ol.style.Rule({
      maxResolution: 50,
      symbolizers: [
        new ol.style.Text({
          color: 'black',
          text: ol.expr.parse('NAME'),
          fontFamily: 'Calibri,sans-serif',
          fontSize: 12,
          stroke: new ol.style.Stroke({
            color: 'white',
            width: 3
          })
        })
      ]
    })
  ]})
});

// Create a GeoAdmin Map
var map = new ga.Map({
  // Add GeoAdmin layers
  layers: [
    ga.layer.create('ch.swisstopo.pixelkarte-farbe'),
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

var displayFeatureInfo = function(pixel) {
  map.getFeatures({
    pixel: pixel,
    layers: [vector],
    success: function(featuresByLayer) {
      var features = featuresByLayer[0];
      document.getElementById('info').innerHTML = features.length > 0 ?
          features[0].get('NAME') + ' - inhabitants: ' + features[0].get('EINWOHNERZ') :
          '&nbsp;';
    }
  });
};

$(map.getViewport()).on('mousemove', function(evt) {
  var pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('singleclick', function(evt) {
  var pixel = evt.getPixel();
  displayFeatureInfo(pixel);
});
