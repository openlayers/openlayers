goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.Stamen');


var layers = [
  new ol.layer.TileLayer({
    source: new ol.source.Stamen({
      layer: 'watercolor'
    })
  }),
  new ol.layer.TileLayer({
    source: new ol.source.Stamen({
      layer: 'terrain-labels'
    })
  })
];
var map = new ol.Map({
  layers: layers,
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    center: new ol.Coordinate(0, 0),
    zoom: 3
  })
});
