goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.OSM');
goog.require('ol.source.TileDebug');


var osmSource = new ol.source.OSM();
var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: osmSource
    }),
    new ol.layer.Tile({
      source: new ol.source.TileDebug({
        projection: 'EPSG:3857',
        tileGrid: osmSource.getTileGrid()
      })
    })
  ],
  renderer: common.getRendererFromQueryString(),
  target: 'map',
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: new ol.View({
    center: ol.proj.transform(
        [-0.1275, 51.507222], 'EPSG:4326', 'EPSG:3857'),
    zoom: 10
  })
});
