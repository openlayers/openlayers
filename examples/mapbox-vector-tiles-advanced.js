import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_format_MVT_ from '../src/ol/format/mvt';
import _ol_layer_VectorTile_ from '../src/ol/layer/vectortile';
import _ol_proj_ from '../src/ol/proj';
import _ol_source_VectorTile_ from '../src/ol/source/vectortile';
import _ol_style_Fill_ from '../src/ol/style/fill';
import _ol_style_Icon_ from '../src/ol/style/icon';
import _ol_style_Stroke_ from '../src/ol/style/stroke';
import _ol_style_Style_ from '../src/ol/style/style';
import _ol_style_Text_ from '../src/ol/style/text';
import _ol_tilegrid_TileGrid_ from '../src/ol/tilegrid/tilegrid';


var key = 'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiRk1kMWZaSSJ9.E5BkluenyWQMsBLsuByrmg';

// Calculation of resolutions that match zoom levels 1, 3, 5, 7, 9, 11, 13, 15.
var resolutions = [];
for (var i = 0; i <= 8; ++i) {
  resolutions.push(156543.03392804097 / Math.pow(2, i * 2));
}
// Calculation of tile urls for zoom levels 1, 3, 5, 7, 9, 11, 13, 15.
function tileUrlFunction(tileCoord) {
  return ('https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/' +
      '{z}/{x}/{y}.vector.pbf?access_token=' + key)
      .replace('{z}', String(tileCoord[0] * 2 - 1))
      .replace('{x}', String(tileCoord[1]))
      .replace('{y}', String(-tileCoord[2] - 1))
      .replace('{a-d}', 'abcd'.substr(
          ((tileCoord[1] << tileCoord[0]) + tileCoord[2]) % 4, 1));
}

var map = new _ol_Map_({
  layers: [
    new _ol_layer_VectorTile_({
      source: new _ol_source_VectorTile_({
        attributions: '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> ' +
          '© <a href="https://www.openstreetmap.org/copyright">' +
          'OpenStreetMap contributors</a>',
        format: new _ol_format_MVT_(),
        tileGrid: new _ol_tilegrid_TileGrid_({
          extent: _ol_proj_.get('EPSG:3857').getExtent(),
          resolutions: resolutions,
          tileSize: 512
        }),
        tileUrlFunction: tileUrlFunction
      }),
      style: createMapboxStreetsV6Style(_ol_style_Style_, _ol_style_Fill_, _ol_style_Stroke_, _ol_style_Icon_, _ol_style_Text_)
    })
  ],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    minZoom: 1,
    zoom: 2
  })
});
