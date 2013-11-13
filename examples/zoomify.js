goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.proj.Projection');
goog.require('ol.proj.Units');
goog.require('ol.source.Zoomify');

var imgWidth = 8001;
var imgHeight = 6943;
var imgCenter = [imgWidth / 2, -imgHeight / 2];
var url = 'http://mapy.mzk.cz/AA22/0103/';

var proj = new ol.proj.Projection({
  code: 'ZOOMIFY',
  units: ol.proj.Units.PIXELS,
  extent: [0, 0, imgWidth, imgHeight]
});

var source = new ol.source.Zoomify({
  url: url,
  size: [imgWidth, imgHeight]
});

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: source
    })
  ],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    projection: proj,
    center: imgCenter,
    zoom: 0
  })
});
