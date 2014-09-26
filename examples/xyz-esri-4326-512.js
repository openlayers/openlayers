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

var size = ol.extent.getWidth(projectionExtent) / 256;
var resolutions = new Array(16);
for (var z = 2; z < 18; ++z) {
  resolutions[z - 2] = size / Math.pow(2, z);
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
