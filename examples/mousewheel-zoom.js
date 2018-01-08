import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {defaults as defaultInteractions} from '../src/ol/interaction.js';
import MouseWheelZoom from '../src/ol/interaction/MouseWheelZoom.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';


var map = new Map({
  interactions: defaultInteractions({mouseWheelZoom: false}).extend([
    new MouseWheelZoom({
      constrainResolution: true // force zooming to a integer zoom
    })
  ]),
  layers: [
    new TileLayer({
      source: new _ol_source_OSM_()
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});
