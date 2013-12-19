goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.Element');
goog.require('ol.source.GoogleMaps');


var map = new ol.Map({
  layers: [
    new ol.layer.Element({
      source: new ol.source.GoogleMaps({
        mapTypeId: google.maps.MapTypeId.TERRAIN
      })
    })
  ],
  renderer: ol.RendererHint.DOM,
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 0
  })
});
