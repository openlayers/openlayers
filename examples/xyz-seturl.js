goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.source.XYZ');


var source = new ol.source.XYZ({
  url: 'http://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
});
var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: source
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 4
  })
});

$('#set-stamen').click(function() {
  source.setUrl('http://{a-d}.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg');
});
$('#set-opencyclemap').click(function() {
  source.setUrl('http://{a-c}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png');
});
$('#set-esri').click(function() {
  source.setUrl('http://server.arcgisonline.com/ArcGIS/rest/services/' +
      'World_Topo_Map/MapServer/tile/{z}/{y}/{x}');
});
