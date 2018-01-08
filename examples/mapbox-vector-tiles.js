import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import MVT from '../src/ol/format/MVT.js';
import _ol_layer_VectorTile_ from '../src/ol/layer/VectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import _ol_style_Fill_ from '../src/ol/style/Fill.js';
import _ol_style_Icon_ from '../src/ol/style/Icon.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';
import _ol_style_Text_ from '../src/ol/style/Text.js';


var key = 'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiRk1kMWZaSSJ9.E5BkluenyWQMsBLsuByrmg';

var map = new Map({
  layers: [
    new _ol_layer_VectorTile_({
      declutter: true,
      source: new VectorTileSource({
        attributions: '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> ' +
          '© <a href="https://www.openstreetmap.org/copyright">' +
          'OpenStreetMap contributors</a>',
        format: new MVT(),
        url: 'https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/' +
            '{z}/{x}/{y}.vector.pbf?access_token=' + key
      }),
      style: createMapboxStreetsV6Style(_ol_style_Style_, _ol_style_Fill_, _ol_style_Stroke_, _ol_style_Icon_, _ol_style_Text_)
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});
