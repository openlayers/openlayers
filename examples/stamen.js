import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import {fromLonLat} from '../src/ol/proj.js';
import _ol_source_Stamen_ from '../src/ol/source/Stamen.js';


var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_Stamen_({
        layer: 'watercolor'
      })
    }),
    new _ol_layer_Tile_({
      source: new _ol_source_Stamen_({
        layer: 'terrain-labels'
      })
    })
  ],
  target: 'map',
  view: new _ol_View_({
    center: fromLonLat([-122.416667, 37.783333]),
    zoom: 12
  })
});
