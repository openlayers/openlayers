import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import ZoomSlider from '../src/ol/control/ZoomSlider.js';

const view = new View({
  center: [328627.563458, 5921296.662223],
  zoom: 8,
  extent: [-572513.341856, 5211017.966314,
    916327.095083, 6636950.728974]
});

new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  keyboardEventTarget: document,
  target: 'map',
  view: view,
  controls: defaultControls().extend([new ZoomSlider()])
});
