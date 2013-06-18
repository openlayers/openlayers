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
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});

var overviewMap = new ol.Map({
  controls: [],
  target: 'overviewmap',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});

overviewMap.bindTo('layers', map);
overviewMap.getView().bindTo('center', map.getView());
