goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Image');
goog.require('ol.source.OSM');
goog.require('ol.source.Raster');


var map = new ol.Map({
  layers: [
    new ol.layer.Image({
      source: new ol.source.Raster({
        sources: [new ol.source.OSM()],
        operations: [function(pixels) {
          var pixel = pixels[0];
          var b = pixel[2];
          pixel[2] = pixel[0];
          pixel[0] = b;
          return pixels;
        }]
      })
    })
  ],
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});
