import Graticule from '../src/ol/layer/Graticule.js';
import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import Stroke from '../src/ol/style/Stroke.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import {fromLonLat} from '../src/ol/proj.js';

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM({
        wrapX: false,
      }),
    }),
    new Graticule({
      // the style to use for the lines, optional.
      strokeStyle: new Stroke({
        color: 'rgba(255,120,0,0.9)',
        width: 2,
        lineDash: [0.5, 4],
      }),
      showLabels: true,
      wrapX: false,
    }),
  ],
  target: 'map',
  view: new View({
    center: fromLonLat([4.8, 47.75]),
    zoom: 5,
  }),
});
