import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {fromLonLat} from '../src/ol/proj.js';
import Stamen from '../src/ol/source/Stamen.js';


const map = new Map({
  layers: [
    new TileLayer({
      source: new Stamen({
        layer: 'watercolor'
      })
    }),
    new TileLayer({
      source: new Stamen({
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
