goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.projection');
goog.require('ol.source.OpenStreetMap');
goog.require('ol.source.WMTS');
goog.require('ol.tilegrid.WMTS');


var projection = ol.projection.get('EPSG:900913');
var projectionExtent = projection.getExtent();
var size = projectionExtent.getWidth() / 256;
var resolutions = new Array(26);
var matrixIds = new Array(26);
for (var z = 0; z < 26; ++z) {
  // generate resolutions and matrixIds arrays for this WMTS
  resolutions[z] = size / Math.pow(2, z);
  matrixIds[z] = 'EPSG:900913:' + z;
}

var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.OpenStreetMap(),
      opacity: 0.7
    }),
    new ol.layer.TileLayer({
      source: new ol.source.WMTS({
        url: 'http://v2.suite.opengeo.org/geoserver/gwc/service/wmts/',
        layer: 'medford:buildings',
        matrixSet: 'EPSG:900913',
        format: 'image/png',
        projection: projection,
        tileGrid: new ol.tilegrid.WMTS({
          origin: projectionExtent.getTopLeft(),
          resolutions: resolutions,
          matrixIds: matrixIds
        }),
        style: '_null',
        extent: new ol.Extent(-13682835, 5204068, -13667473, 5221690)
      })
    })
  ],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: new ol.Coordinate(-13677832, 5213272),
    zoom: 13
  })
});
