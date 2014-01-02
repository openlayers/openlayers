goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.proj.Projection');
goog.require('ol.proj.Units');
goog.require('ol.source.Zoomify');

// This server does not support CORS, and so is incompatible with WebGL.
//var imgWidth = 8001;
//var imgHeight = 6943;
//var url = 'http://mapy.mzk.cz/AA22/0103/';
//var crossOrigin = undefined;

var imgWidth = 9911;
var imgHeight = 6100;
var url = 'http://vips.vtech.fr/cgi-bin/iipsrv.fcgi?zoomify=' +
        '/mnt/MD1/AD00/plan_CHU-4HD-01/FOND.TIF/';
var crossOrigin = 'anonymous';

var imgCenter = [imgWidth / 2, - imgHeight / 2];
var proj = new ol.proj.Projection({
  code: 'ZOOMIFY',
  units: ol.proj.Units.PIXELS,
  extent: [0, 0, imgWidth, imgHeight]
});

var source = new ol.source.Zoomify({
  url: url,
  size: [imgWidth, imgHeight],
  crossOrigin: crossOrigin
});

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: source
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    projection: proj,
    center: imgCenter,
    zoom: 0
  })
});
