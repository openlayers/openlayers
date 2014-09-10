goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');


var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  renderer: exampleNS.getRendererFromQueryString(),
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});

map.setTarget('map1');

var teleportButton = document.getElementById('teleport');

teleportButton.addEventListener('click', function() {
  var target = map.getTarget() === 'map1' ? 'map2' : 'map1';
  map.setTarget(target);
}, false);
