goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.interaction.DragZoom');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');


var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});

var dragzoom = new ol.interaction.DragZoom();
map.addInteraction(dragzoom);
