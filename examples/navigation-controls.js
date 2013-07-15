goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.control.ZoomToExtent');
goog.require('ol.control.defaults');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.OSM');


var map = new ol.Map({
  controls: ol.control.defaults({}, [
    new ol.control.ZoomToExtent({
      extent: [
        813079.7791264898,
        848966.9639063801,
        5929220.284081122,
        5936863.986909639
      ]
    })
  ]),
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
