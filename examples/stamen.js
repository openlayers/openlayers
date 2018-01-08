import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {fromLonLat} from '../src/ol/proj.js';
import _ol_source_Stamen_ from '../src/ol/source/Stamen.js';


var map = new Map({
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
  view: new View({
    center: fromLonLat([-122.416667, 37.783333]),
    zoom: 12
  })
});
