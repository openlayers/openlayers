goog.require('ol.Geolocation');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.BingMaps');


var view = new ol.View2D({
  center: [0, 0],
  zoom: 2
});

var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.BingMaps({
        key: 'AlQLZ0-5yk301_ESrmNLma3LYxEKNSg7w-e_knuRfyYFtld-UFvXVs38NOulku3Q',
        style: 'Road'
      })
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: view
});

var geolocation = new ol.Geolocation({
  tracking: true
});
geolocation.bindTo('projection', view);
geolocation.once('position_changed', function() {
  view.setCenter(geolocation.getPosition());
  view.setResolution(2.388657133911758);
});
