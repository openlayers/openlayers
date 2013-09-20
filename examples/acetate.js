goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.proj');
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
    center: ol.proj.transform(
        [-117.19565, 34.056766], 'EPSG:4326', 'EPSG:3857'),
    zoom: 9
  })
});
