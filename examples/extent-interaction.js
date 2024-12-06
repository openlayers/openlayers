import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {shiftKeyOnly} from '../src/ol/events/condition.js';
import ExtentInteraction from '../src/ol/interaction/Extent.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';

const map = new Map({
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

const extent = new ExtentInteraction({condition: shiftKeyOnly});
map.addInteraction(extent);
