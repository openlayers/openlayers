goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Image');
goog.require('ol.layer.Tile');
goog.require('ol.source.BingMaps');
goog.require('ol.source.Raster');

function tgi(pixels) {
  var pixel = pixels[0];
  var r = pixel[0] / 255;
  var g = pixel[1] / 255;
  var b = pixel[2] / 255;
  var index = (120 * (r - b) - (190 * (r - g))) / 2;
  pixel[0] = index;
  return pixels;
}

var threshold = 10;

function color(pixels) {
  var pixel = pixels[0];
  var index = pixel[0];
  if (index > threshold) {
    pixel[0] = 0;
    pixel[1] = 255;
    pixel[2] = 0;
    pixel[3] = 255;
  } else {
    pixel[3] = 0;
  }
  return pixels;
}

var bing = new ol.source.BingMaps({
  key: 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3',
  imagerySet: 'Aerial'
});

var imagery = new ol.layer.Tile({
  source: bing
});

var greenness = new ol.layer.Image({
  source: new ol.source.Raster({
    sources: [bing],
    operations: [tgi, color]
  })
});

var map = new ol.Map({
  layers: [imagery, greenness],
  target: 'map',
  view: new ol.View({
    center: [-9651695.964309687, 4937351.719788862],
    zoom: 13,
    minZoom: 12
  })
});
