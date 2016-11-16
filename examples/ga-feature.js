goog.require('ga.Map');
goog.require('ga.layer');
goog.require('ol.View');

// Create a GeoAdmin Map
var map = new ga.Map({
  // Define the div where the map is placed
  target: 'map',
  // Create a 2D view
  view: new ol.View({
    // Define the default resolution
    // 10 means that one pixel is 10m width and height
    // List of resolution of the WMTS layers:
    // 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1, 0.5, 0.25, 0.1
    resolution: 10,
    // Define a coordinate CH1903 for the center of the view
    center: [561666.5, 185569.5]
  })
});

var lyr = ga.layer.create('ch.swisstopo.pixelkarte-farbe');
var lyr1 = ga.layer.create('ch.swisstopo.fixpunkte-agnes');

map.addLayer(lyr);
map.addLayer(lyr1);

map.recenterFeature('ch.swisstopo.fixpunkte-agnes', 'PAYE');
map.highlightFeature('ch.swisstopo.fixpunkte-agnes', 'PAYE');

//map.recenterFeature('ch.swisstopo.pixelkarte-pk200.metadata', '200-3');
//map.highlightFeature('ch.swisstopo.pixelkarte-pk200.metadata', '200-3');

//map.recenterFeature('ch.bav.laerm-emissionplan_eisenbahn_2015', '3005751.0');
//map.highlightFeature('ch.bav.laerm-emissionplan_eisenbahn_2015', '3005751.0');
