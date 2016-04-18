goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.XYZ');

var attribution = new ol.Attribution({
  html: 'Copyright:© 2013 ESRI, i-cubed, GeoEye'
});

var projection = ol.proj.get('EPSG:4326');

// The tile size supported by the ArcGIS tile service.
var tileSize = 512;

var urlTemplate = 'http://services.arcgisonline.com/arcgis/rest/services/' +
    'ESRI_Imagery_World_2D/MapServer/tile/{z}/{y}/{x}';

var map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.XYZ({
        attributions: [attribution],
        maxZoom: 16,
        projection: projection,
        tileSize: tileSize,
        tileUrlFunction: function(tileCoord) {
          return urlTemplate.replace('{z}', (tileCoord[0] - 1).toString())
                            .replace('{x}', tileCoord[1].toString())
                            .replace('{y}', (-tileCoord[2] - 1).toString());
        },
        wrapX: true
      })
    })
  ],
  view: new ol.View({
    center: [0, 0],
    projection: projection,
    zoom: 2,
    minZoom: 2
  })
});
