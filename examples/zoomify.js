goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.proj.Projection');
goog.require('ol.source.Zoomify');

var imgWidth = 9911;
var imgHeight = 6100;

var imgCenter = [imgWidth / 2, -imgHeight / 2];

// Maps always need a projection, but Zoomify layers are not geo-referenced, and
// are only measured in pixels.  So, we create a fake projection that the map
// can use to properly display the layer.
var proj = new ol.proj.Projection({
  code: 'ZOOMIFY',
  units: 'pixels',
  extent: [0, 0, imgWidth, imgHeight]
});

var source = new ol.source.Zoomify({
  url: 'http://vips.vtech.fr/cgi-bin/iipsrv.fcgi?zoomify=' +
      '/mnt/MD1/AD00/plan_CHU-4HD-01/FOND.TIF/',
  size: [imgWidth, imgHeight],
  crossOrigin: 'anonymous'
});

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: source
    })
  ],
  target: 'map',
  view: new ol.View({
    projection: proj,
    center: imgCenter,
    zoom: 2,
    // constrain the center: center cannot be set outside
    // this extent
    extent: [0, -imgHeight, imgWidth, 0]
  })
});
