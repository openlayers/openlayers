goog.require('ol.Geolocation');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.BingMaps');


var view = new ol.View({
  center: [0, 0],
  zoom: 2
});

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.BingMaps({
        key: 'AkGbxXx6tDWf1swIhPJyoAVp06H0s0gDTYslNWWHZ6RoPqMpB9ld5FY1WutX8UoF',
        imagerySet: 'Road'
      })
    })
  ],
  renderer: common.getRendererFromQueryString(),
  target: 'map',
  view: view
});

var geolocation = new ol.Geolocation({
  projection: view.getProjection(),
  tracking: true
});
geolocation.once('change:position', function() {
  view.setCenter(geolocation.getPosition());
  view.setResolution(2.388657133911758);
});

// Use FastClick to eliminate the 300ms delay between a physical tap
// and the firing of a click event on mobile browsers.
// See http://updates.html5rocks.com/2013/12/300ms-tap-delay-gone-away
// for more information.
document.addEventListener('DOMContentLoaded', function() {
  FastClick.attach(document.body);
});
