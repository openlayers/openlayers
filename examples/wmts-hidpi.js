import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_format_WMTSCapabilities_ from '../src/ol/format/wmtscapabilities';
import _ol_has_ from '../src/ol/has';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_WMTS_ from '../src/ol/source/wmts';


var capabilitiesUrl = 'https://www.basemap.at/wmts/1.0.0/WMTSCapabilities.xml';

// HiDPI support:
// * Use 'bmaphidpi' layer (pixel ratio 2) for device pixel ratio > 1
// * Use 'geolandbasemap' layer (pixel ratio 1) for device pixel ratio == 1
var hiDPI = _ol_has_.DEVICE_PIXEL_RATIO > 1;
var layer = hiDPI ? 'bmaphidpi' : 'geolandbasemap';
var tilePixelRatio = hiDPI ? 2 : 1;

var map = new _ol_Map_({
  target: 'map',
  view: new _ol_View_({
    center: [1823849, 6143760],
    zoom: 11
  })
});

fetch(capabilitiesUrl).then(function(response) {
  return response.text();
}).then(function(text) {
  var result = new _ol_format_WMTSCapabilities_().read(text);
  var options = _ol_source_WMTS_.optionsFromCapabilities(result, {
    layer: layer,
    matrixSet: 'google3857',
    style: 'normal'
  });
  options.tilePixelRatio = tilePixelRatio;
  map.addLayer(new _ol_layer_Tile_({
    source: new _ol_source_WMTS_(/** @type {!olx.source.WMTSOptions} */ (options))
  }));
});
