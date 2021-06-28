import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import {ZoomToExtent, defaults as defaultControls} from '../src/ol/control.js';

const map = new Map({
  controls: defaultControls().extend([
    new ZoomToExtent({
      extent: [
        813079.7791264898, 5929220.284081122, 848966.9639063801,
        5936863.986909639,
      ],
    }),
  ]),
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});
