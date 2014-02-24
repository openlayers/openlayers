goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');


var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  renderer: exampleNS.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View2D({
    center: [-25860000, 4130000],
    rotation: Math.PI / 6,
    zoom: 10
  })
});
