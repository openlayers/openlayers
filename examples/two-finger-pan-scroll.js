import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import {DragPan, MouseWheelZoom, defaults} from '../src/ol/interaction.js';
import {platformModifierKeyOnly} from '../src/ol/events/condition.js';

const map = new Map({
  interactions: defaults({dragPan: false, mouseWheelZoom: false}).extend([
    new DragPan({
      condition: function (event) {
        return this.getPointerCount() === 2 || platformModifierKeyOnly(event);
      },
    }),
    new MouseWheelZoom({
      condition: platformModifierKeyOnly,
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
