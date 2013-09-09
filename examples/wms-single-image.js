goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.Image');
goog.require('ol.layer.Tile');
goog.require('ol.source.MapQuestOpenAerial');
goog.require('ol.source.SingleImageWMS');


var layers = [
  new ol.layer.Tile({
    source: new ol.source.MapQuestOpenAerial()
  }),
  new ol.layer.Image({
    source: new ol.source.SingleImageWMS({
      url: 'http://demo.opengeo.org/geoserver/wms',
      params: {'LAYERS': 'topp:states'},
      extent: [-13884991, -7455066, 2870341, 6338219]
    })
  })
];
var map = new ol.Map({
  renderer: ol.RendererHint.CANVAS,
  layers: layers,
  target: 'map',
  view: new ol.View2D({
    center: [-10997148, 4569099],
    zoom: 4
  })
});
