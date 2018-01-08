import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_source_Zoomify_ from '../src/ol/source/Zoomify.js';

var imgWidth = 9911;
var imgHeight = 6100;

var zoomifyUrl = 'http://vips.vtech.fr/cgi-bin/iipsrv.fcgi?zoomify=' +
    '/mnt/MD1/AD00/plan_CHU-4HD-01/FOND.TIF/';
var iipUrl = 'http://vips.vtech.fr/cgi-bin/iipsrv.fcgi?FIF=' + '/mnt/MD1/AD00/plan_CHU-4HD-01/FOND.TIF' +  '&JTL={z},{tileIndex}';

var layer = new TileLayer({
  source: new _ol_source_Zoomify_({
    url: zoomifyUrl,
    size: [imgWidth, imgHeight],
    crossOrigin: 'anonymous'
  })
});

var extent = [0, -imgHeight, imgWidth, 0];

var map = new Map({
  layers: [layer],
  target: 'map',
  view: new View({
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
    layer.setSource(new _ol_source_Zoomify_({
      url: iipUrl,
      size: [imgWidth, imgHeight],
      crossOrigin: 'anonymous'
    }));
  } else if (value === 'zoomify') {
    layer.setSource(new _ol_source_Zoomify_({
      url: zoomifyUrl,
      size: [imgWidth, imgHeight],
      crossOrigin: 'anonymous'
    }));
  }

});
