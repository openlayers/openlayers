import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {defaults as defaultInteractions, MouseWheelZoom} from '../src/ol/interaction.js';
import {focus} from '../src/ol/events/condition.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';


const map = new Map({
  interactions: defaultInteractions({mouseWheelZoom: false}).extend([
    new MouseWheelZoom({
      constrainResolution: true, // force zooming to a integer zoom
      condition: focus // only wheel/trackpad zoom when the map has the focus
    })
  ]),
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});
