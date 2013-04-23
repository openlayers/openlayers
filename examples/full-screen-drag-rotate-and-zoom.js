goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.control.FullScreen');
goog.require('ol.control.defaults');
goog.require('ol.interaction.DragRotateAndZoom');
goog.require('ol.interaction.defaults');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.BingMaps');


var map = new ol.Map({
  controls: ol.control.defaults({}, [
    new ol.control.FullScreen()
  ]),
  interactions: ol.interaction.defaults({}, [
    new ol.interaction.DragRotateAndZoom()
  ]),
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.BingMaps({
        key: 'AlQLZ0-5yk301_ESrmNLma3LYxEKNSg7w-e_knuRfyYFtld-UFvXVs38NOulku3Q',
        style: 'Aerial'
      })
    })
  ],
  // Use the canvas renderer because it's currently the fastest
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [-33519607, 5616436],
    rotation: -Math.PI / 8,
    zoom: 8
  })
});
