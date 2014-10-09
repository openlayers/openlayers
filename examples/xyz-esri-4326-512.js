goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.extent');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.TileImage');
goog.require('ol.tilegrid.TileGrid');

var attribution = new ol.Attribution({
  html: 'Copyright:&copy; 2013 ESRI, i-cubed, GeoEye'
});

var projection = ol.proj.get('EPSG:4326');
var projectionExtent = projection.getExtent();

// The tile size supported by the ArcGIS tile service.
var tileSize = 512;

// Calculate the resolutions supported by the ArcGIS tile service.
// There are 16 resolutions, with a factor of 2 between successive
// resolutions. The max resolution is such that the world (360°)
// fits into two (512x512 px) tiles.
var maxResolution = ol.extent.getWidth(projectionExtent) / (tileSize * 2);
var resolutions = new Array(16);
var z;
for (z = 0; z < 16; ++z) {
  resolutions[z] = maxResolution / Math.pow(2, z);
}

var url = 'http://services.arcgisonline.com/arcgis/rest/services/' +
    'ESRI_Imagery_World_2D/MapServer/tile/';

var map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      extent: projectionExtent,
      /* ol.source.XYZ and ol.tilegrid.XYZ have nu resolutions config */
      source: new ol.source.TileImage({
        attributions: [attribution],
        tileUrlFunction: function(tileCoord, pixelRatio, projection) {
          return url + tileCoord[0] + '/' + (-tileCoord[2] - 1) + '/' +
              tileCoord[1];
        },
        projection: projection,
        tileGrid: new ol.tilegrid.TileGrid({
          origin: ol.extent.getTopLeft(projectionExtent),
          resolutions: resolutions,
          tileSize: 512
        })
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
