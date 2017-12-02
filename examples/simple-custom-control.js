goog.require('ol');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.control.Control');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');


// Define rotate to north control.

var button = document.createElement('button');
button.innerHTML = 'N';

var handleRotateNorth = function(e) {
    map.getView().setRotation(0);
};

button.addEventListener('click', handleRotateNorth, false);

var element = document.createElement('div');
element.className = 'rotate-north ol-unselectable ol-control';
element.appendChild(button);

var RotateNorthControl = new ol.control.Control({
    element: element
});

// Create map, giving it a rotate to north control.

var map = new ol.Map({
  controls: ol.control.defaults({
    attributionOptions: ({
      collapsible: false
    })
  }).extend([
    RotateNorthControl
  ]),
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  renderer: common.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2,
    rotation: 1
  })
});
