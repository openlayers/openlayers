import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {defaults as defaultInteractions, PinchZoom} from '../src/ol/interaction.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';


const map = new Map({
  interactions: defaultInteractions().extend([
    new PinchZoom()
  ]),
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
    constrainResolution: true
  })
});
