goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.OSM');


var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.OSM()
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});

map.setTarget('map1');

var teleportButton = document.getElementById('teleport');

teleportButton.addEventListener('click', function() {
  var target = map.getTarget().id === 'map1' ? 'map2' : 'map1';
  map.setTarget(target);
}, false);
