goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.Zoomify');

var imgWidth = 9911;
var imgHeight = 6100;

var source = new ol.source.Zoomify({
  url: 'http://vips.vtech.fr/cgi-bin/iipsrv.fcgi?zoomify=' +
      '/mnt/MD1/AD00/plan_CHU-4HD-01/FOND.TIF/',
  size: [imgWidth, imgHeight],
  crossOrigin: 'anonymous'
});
var extent = [0, -imgHeight, imgWidth, 0];

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: source
    })
  ],
  target: 'map',
  view: new ol.View({
    // adjust zoom levels to those provided by the source
    resolutions: source.getTileGrid().getResolutions(),
    // constrain the center: center cannot be set outside this extent
    extent: extent
  })
});
map.getView().fit(extent);
