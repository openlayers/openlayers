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
