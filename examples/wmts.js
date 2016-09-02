goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.extent');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.OSM');
goog.require('ol.source.WMTS');
goog.require('ol.tilegrid.WMTS');


var projection = ol.proj.get('EPSG:3857');
var projectionExtent = projection.getExtent();
var size = ol.extent.getWidth(projectionExtent) / 256;
var resolutions = new Array(14);
var matrixIds = new Array(14);
for (var z = 0; z < 14; ++z) {
  // generate resolutions and matrixIds arrays for this WMTS
  resolutions[z] = size / Math.pow(2, z);
  matrixIds[z] = z;
}

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(),
      opacity: 0.7
    }),
    new ol.layer.Tile({
      opacity: 0.7,
      source: new ol.source.WMTS({
        attributions: 'Tiles © <a href="http://services.arcgisonline.com/arcgis/rest/' +
            'services/Demographics/USA_Population_Density/MapServer/">ArcGIS</a>',
        url: 'https://services.arcgisonline.com/arcgis/rest/' +
            'services/Demographics/USA_Population_Density/MapServer/WMTS/',
        layer: '0',
        matrixSet: 'EPSG:3857',
        format: 'image/png',
        projection: projection,
        tileGrid: new ol.tilegrid.WMTS({
          origin: ol.extent.getTopLeft(projectionExtent),
          resolutions: resolutions,
          matrixIds: matrixIds
        }),
        style: 'default',
        wrapX: true
      })
    })
  ],
  target: 'map',
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: new ol.View({
    center: [-11158582, 4813697],
    zoom: 4
  })
});
