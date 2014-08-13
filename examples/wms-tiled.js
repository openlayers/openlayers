goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.MapQuest');
goog.require('ol.source.TileWMS');


var layers = [
  new ol.layer.Tile({
    source: new ol.source.MapQuest({layer: 'sat'})
  }),
  new ol.layer.Tile({
    extent: [-13884991, 2870341, -7455066, 6338219],
    source: new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
      url: 'http://demo.opengeo.org/geoserver/wms',
      params: {'LAYERS': 'topp:states', 'TILED': true},
      serverType: 'geoserver'
    }))
  })
];
var map = new ol.Map({
  layers: layers,
  target: 'map',
  view: new ol.View({
    center: [-10997148, 4569099],
    zoom: 4
  })
});
