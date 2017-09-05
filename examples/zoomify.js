import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_Zoomify_ from '../src/ol/source/zoomify';

var imgWidth = 9911;
var imgHeight = 6100;

var source = new _ol_source_Zoomify_({
  url: 'http://vips.vtech.fr/cgi-bin/iipsrv.fcgi?zoomify=' +
      '/mnt/MD1/AD00/plan_CHU-4HD-01/FOND.TIF/',
  size: [imgWidth, imgHeight],
  crossOrigin: 'anonymous'
});
var extent = [0, -imgHeight, imgWidth, 0];

var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: source
    })
  ],
  target: 'map',
  view: new _ol_View_({
    // adjust zoom levels to those provided by the source
    resolutions: source.getTileGrid().getResolutions(),
    // constrain the center: center cannot be set outside this extent
    extent: extent
  })
});
map.getView().fit(extent);
