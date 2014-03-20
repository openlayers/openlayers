goog.require('ga.Map');
goog.require('ol.interaction');
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
    resolution: 20,
    // Define a coordinate CH1903 for the center of the view
    center: [696786, 225190]
  }),
  tooltip: false, 
  interactions: ol.interaction.defaults({doubleClickZoom: false, dragPan: false, mouseWheelZoom: false})
});

var lyr = ga.layer.create('ch.swisstopo.pixelkarte-farbe');
var lyr2 = ga.layer.create('ch.astra.strassenverkehrszaehlung_messstellen-uebergeordnet');
var lyr3 = ga.layer.create('ch.astra.strassenverkehrszaehlung_messstellen-regional_lokal');

map.addLayer(lyr); map.addLayer(lyr2); map.addLayer(lyr3);


//ap.recenterFeature('ch.astra.strassenverkehrszaehlung_messstellen-uebergeordnet', '638');
//map.highlightFeature('ch.astra.strassenverkehrszaehlung_messstellen-regional_lokal', '638');

//map.recenterFeature('ch.swisstopo.pixelkarte-pk200.metadata', '200-3');
//map.highlightFeature('ch.swisstopo.pixelkarte-pk200.metadata', '200-3');

//map.recenterFeature('ch.bav.laerm-emissionplan_eisenbahn_2015', '3005751.0');
//map.highlightFeature('ch.bav.laerm-emissionplan_eisenbahn_2015', '3005751.0');

//second Map
var map2 = new ga.Map({
  // Define the div where the map is placed
  target: 'map2',
  // Create a 2D view
  view: new ol.View2D({
    // Define the default resolution
    // 10 means that one pixel is 10m width and height
    // List of resolution of the WMTS layers:
    // 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1, 0.5, 0.25, 0.1
    resolution: 2,
    // Define a coordinate CH1903 for the center of the view
    center: [696786, 225190]
  }),
  tooltip: false,
  interactions: ol.interaction.defaults({doubleClickZoom: false, dragPan: false, mouseWheelZoom: false})
});

map2.addLayer(lyr); map2.addLayer(lyr2); map2.addLayer(lyr3);
