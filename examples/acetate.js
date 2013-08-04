goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.proj');
goog.require('ol.proj.EPSG3857');
goog.require('ol.source.Acetate');


var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.Acetate({
        layer: 'terrain'
      })
    }),
    new ol.layer.TileLayer({
      source: new ol.source.Acetate({
        layer: 'acetate-labels'
      })
    })
  ],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: ol.proj.EPSG3857.fromEPSG4326([-117.19565, 34.056766]),
    zoom: 9
  })
});
