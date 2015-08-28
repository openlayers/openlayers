goog.require('ga.Map');
goog.require('ga.layer');
goog.require('ol.View');
goog.require('ol.layer.Vector');
goog.require('ol.format.KML');


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
    resolution: 100,
    // Define a coordinate CH1903 for the center of the view
    center: [791653.4904715178, 145041.76478935662]
  })
});

// Create the KML Layer
var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'data/kml/bln-style.kml',
    format: new ol.format.KML({
      projection: 'EPSG:21781'
    })
  })
});



//var lyr = ga.layer.create('ch.blw.alpprodukte');
//var lyr = ga.layer.create('ch.bfs.gebaeude_wohnungs_register_wmts');
//var lyr1 = ga.layer.create('ch.swisstopo.swissimage');
//var lyr = ga.layer.create('ch.bfs.gebaeude_wohnungs_register_wms');
//var lyr = ga.layer.create('ch.kantone.cadastralwebmap-farbe');
//var lyr = ga.layer.create('ch.swisstopo-vd.geometa-gemeinde');
//var lyr = ga.layer.create('ch.swisstopo.fixpunkte-hfp1');
var lyr = ga.layer.create('ch.bafu.ren-wald');
var baseLayer = ga.layer.create('ch.swisstopo.pixelkarte-farbe');

map.addLayer(baseLayer);
map.addLayer(lyr);
map.addLayer(vector);
