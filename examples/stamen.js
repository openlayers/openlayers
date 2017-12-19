import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {fromLonLat} from '../src/ol/proj.js';
import _ol_source_Stamen_ from '../src/ol/source/Stamen.js';


var map = new _ol_Map_({
  layers: [
    new TileLayer({
      source: new _ol_source_Stamen_({
        layer: 'watercolor'
      })
    }),
    new TileLayer({
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
