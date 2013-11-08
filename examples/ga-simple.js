goog.require('ga.Map');
goog.require('ga.layer');
goog.require('ol.View2D');

// Create a GeoAdmin Map
var map = new ga.Map({
  // Define the div where the map is placed
  target: 'map',
  // layer to add
  layernames: ['ch.swisstopo.pixelkarte-farbe-pk25.noscale'],
  // Create a 2D view
  view: new ol.View2D({
    // Define the default resolution
    // 10 means that one pixel is 10m width and height
    // List of resolution of the WMTS layers:
    // 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1, 0.5, 0.25, 0.1
    resolution: 5,
    // Define a coordinate CH1903 for the center of the view
    center: [561666.5, 185569.5]
  })
});



