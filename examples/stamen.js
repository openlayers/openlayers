goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.projection');
goog.require('ol.source.Stamen');


var map = new ol.Map({
  layers: [
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
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    center: ol.projection.transform(
        [-122.416667, 37.783333], 'EPSG:4326', 'EPSG:3857'),
    zoom: 12
  })
});
