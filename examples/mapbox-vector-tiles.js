import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_format_MVT_ from '../src/ol/format/mvt';
import _ol_layer_VectorTile_ from '../src/ol/layer/vectortile';
import _ol_source_VectorTile_ from '../src/ol/source/vectortile';
import _ol_style_Fill_ from '../src/ol/style/fill';
import _ol_style_Icon_ from '../src/ol/style/icon';
import _ol_style_Stroke_ from '../src/ol/style/stroke';
import _ol_style_Style_ from '../src/ol/style/style';
import _ol_style_Text_ from '../src/ol/style/text';


var key = 'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiRk1kMWZaSSJ9.E5BkluenyWQMsBLsuByrmg';

var map = new _ol_Map_({
  layers: [
    new _ol_layer_VectorTile_({
      source: new _ol_source_VectorTile_({
        attributions: '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> ' +
          '© <a href="https://www.openstreetmap.org/copyright">' +
          'OpenStreetMap contributors</a>',
        format: new _ol_format_MVT_(),
        url: 'https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/' +
            '{z}/{x}/{y}.vector.pbf?access_token=' + key
      }),
      style: createMapboxStreetsV6Style(_ol_style_Style_, _ol_style_Fill_, _ol_style_Stroke_, _ol_style_Icon_, _ol_style_Text_)
    })
  ],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  })
});
