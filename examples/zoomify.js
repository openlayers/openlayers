goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.Zoomify');

var imgWidth = 9911;
var imgHeight = 6100;

var zoomifyUrl = 'http://vips.vtech.fr/cgi-bin/iipsrv.fcgi?zoomify=' +
    '/mnt/MD1/AD00/plan_CHU-4HD-01/FOND.TIF/';
var iipUrl = 'http://vips.vtech.fr/cgi-bin/iipsrv.fcgi?FIF=' + '/mnt/MD1/AD00/plan_CHU-4HD-01/FOND.TIF' +  '&JTL={z},{tileIndex}';

var layer = new ol.layer.Tile({
  source: new ol.source.Zoomify({
    url: zoomifyUrl,
    size: [imgWidth, imgHeight],
    crossOrigin: 'anonymous'
  })
});

var extent = [0, -imgHeight, imgWidth, 0];

var map = new ol.Map({
  layers: [layer],
  target: 'map',
  view: new ol.View({
    // adjust zoom levels to those provided by the source
    resolutions: layer.getSource().getTileGrid().getResolutions(),
    // constrain the center: center cannot be set outside this extent
    extent: extent
  })
});
map.getView().fit(extent);

var control = document.getElementById('zoomifyProtocol');
control.addEventListener('change', function(event) {
  var value = event.currentTarget.value;
  if (value === 'iip') {
    layer.setSource(new ol.source.Zoomify({
      url: iipUrl,
      size: [imgWidth, imgHeight],
      crossOrigin: 'anonymous'
    }));
  } else if (value === 'zoomify') {
    layer.setSource(new ol.source.Zoomify({
      url: zoomifyUrl,
      size: [imgWidth, imgHeight],
      crossOrigin: 'anonymous'
    }));
  }

});
