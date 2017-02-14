goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');
goog.require('ol.source.TileWMS');
goog.require('ol.tilegrid');


var layers = [
  new ol.layer.Tile({
    source: new ol.source.OSM()
  }),
  new ol.layer.Tile({
    extent: [-13884991, 2870341, -7455066, 6338219],
    source: new ol.source.TileWMS({
      url: 'https://ahocevar.com/geoserver/wms',
      params: {'LAYERS': 'topp:states', 'TILED': true},
      serverType: 'geoserver',
      tileGrid: ol.tilegrid.createXYZ({tileSize: [192, 256]}),
      tileLoadFunction: function(tile, src) {
        tile.getImage().src = src + '&tc=' + tile.getTileCoord().toString();
      }
    })
  })
];
var map = new ol.Map({
  layers: layers,
  target: 'map',
  view: new ol.View({
    center: [-10997148, 4569099],
    zoom: 5,
    resolutions: layers[1].getSource().getTileGrid().getResolutions()
  })
});
