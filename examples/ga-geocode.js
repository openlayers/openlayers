goog.require('ga.Map');
goog.require('ga.layer');
goog.require('ol.View2D');

// Create a GeoAdmin Map
var map = new ga.Map({
  // Define the div where the map is placed
  target: 'map',
  // Create a 2D view
  view: new ol.View2D({
    // Define the default resolution
    // 10 means that one pixel is 10m width and height
    // List of resolution of the WMTS layers:
    // 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1, 0.5, 0.25, 0.1
    resolution: 650,
    // Define a coordinate CH1903 for the center of the view
    center: [600000, 200000]
  })
});

var lyr1 = ga.layer.create('ch.swisstopo.pixelkarte-farbe');

map.addLayer(lyr1);

map.geocode('Payerne');
//map.geocode('Payerne berges 37');

