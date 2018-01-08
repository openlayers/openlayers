import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {defaults as defaultInteractions} from '../src/ol/interaction.js';
import _ol_interaction_PinchZoom_ from '../src/ol/interaction/PinchZoom.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';


var map = new Map({
  interactions: defaultInteractions({pinchZoom: false}).extend([
    new _ol_interaction_PinchZoom_({
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
