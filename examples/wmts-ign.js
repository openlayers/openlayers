import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import _ol_control_ from '../src/ol/control.js';
import * as _ol_extent_ from '../src/ol/extent.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import _ol_proj_ from '../src/ol/proj.js';
import _ol_source_WMTS_ from '../src/ol/source/WMTS.js';
import _ol_tilegrid_WMTS_ from '../src/ol/tilegrid/WMTS.js';


var map = new _ol_Map_({
  target: 'map',
  controls: _ol_control_.defaults({
    attributionOptions: {
      collapsible: false
    }
  }),
  view: new _ol_View_({
    zoom: 5,
    center: _ol_proj_.transform([5, 45], 'EPSG:4326', 'EPSG:3857')
  })
});

var resolutions = [];
var matrixIds = [];
var proj3857 = _ol_proj_.get('EPSG:3857');
var maxResolution = _ol_extent_.getWidth(proj3857.getExtent()) / 256;

for (var i = 0; i < 18; i++) {
  matrixIds[i] = i.toString();
  resolutions[i] = maxResolution / Math.pow(2, i);
}

var tileGrid = new _ol_tilegrid_WMTS_({
  origin: [-20037508, 20037508],
  resolutions: resolutions,
  matrixIds: matrixIds
});

// API key valid for 'openlayers.org' and 'localhost'.
// Expiration date is 06/29/2018.
var key = '2mqbg0z6cx7ube8gsou10nrt';

var ign_source = new _ol_source_WMTS_({
  url: 'https://wxs.ign.fr/' + key + '/wmts',
  layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS',
  matrixSet: 'PM',
  format: 'image/jpeg',
  projection: 'EPSG:3857',
  tileGrid: tileGrid,
  style: 'normal',
  attributions: '<a href="http://www.geoportail.fr/" target="_blank">' +
        '<img src="https://api.ign.fr/geoportail/api/js/latest/' +
        'theme/geoportal/img/logo_gp.gif"></a>'
});

var ign = new _ol_layer_Tile_({
  source: ign_source
});

map.addLayer(ign);
