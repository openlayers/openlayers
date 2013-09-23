goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.control');
goog.require('ol.control.FullScreen');
goog.require('ol.layer.Tile');
goog.require('ol.source.BingMaps');


var view = new ol.View2D({
  center: [-9101767, 2822912],
  zoom: 14
});

var map = new ol.Map({
  controls: ol.control.defaults().extend([
    new ol.control.FullScreen()
  ]),
  layers: [
    new ol.layer.Tile({
      source: new ol.source.BingMaps({
        key: 'Ar33pRUvQOdESG8m_T15MUmNz__E1twPo42bFx9jvdDePhX0PNgAcEm44OVTS7tt',
        style: 'Aerial'
      })
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: view
});
