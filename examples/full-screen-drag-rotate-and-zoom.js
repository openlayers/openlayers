goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.control.FullScreen');
goog.require('ol.interaction');
goog.require('ol.interaction.DragRotateAndZoom');
goog.require('ol.layer.Tile');
goog.require('ol.source.BingMaps');


var map = new ol.Map({
  controls: ol.control.defaults().extend([
    new ol.control.FullScreen()
  ]),
  interactions: ol.interaction.defaults().extend([
    new ol.interaction.DragRotateAndZoom()
  ]),
  layers: [
    new ol.layer.Tile({
      source: new ol.source.BingMaps({
        key: 'AkGbxXx6tDWf1swIhPJyoAVp06H0s0gDTYslNWWHZ6RoPqMpB9ld5FY1WutX8UoF',
        imagerySet: 'Aerial'
      })
    })
  ],
  // Use the canvas renderer because it's currently the fastest
  target: 'map',
  view: new ol.View({
    center: [-33519607, 5616436],
    rotation: -Math.PI / 8,
    zoom: 8
  })
});
