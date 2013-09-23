goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
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
        key: 'Ar33pRUvQOdESG8m_T15MUmNz__E1twPo42bFx9jvdDePhX0PNgAcEm44OVTS7tt',
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
