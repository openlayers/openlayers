goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Image');
goog.require('ol.layer.Tile');
goog.require('ol.source.ImageWMS');
goog.require('ol.source.OSM');


var layers = [
  new ol.layer.Tile({
    source: new ol.source.OSM()
  }),
  new ol.layer.Image({
    extent: [-13884991, 2870341, -7455066, 6338219],
    source: new ol.source.ImageWMS({
      url: 'http://demo.boundlessgeo.com/geoserver/wms',
      params: {'LAYERS': 'topp:states'},
      serverType: 'geoserver'
    })
  })
];
var map = new ol.Map({
  layers: layers,
  target: 'map',
  renderer: common.getRendererFromQueryString(),
  view: new ol.View({
    center: [-10997148, 4569099],
    zoom: 4
  })
});
