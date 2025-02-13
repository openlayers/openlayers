import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Attribution from '../src/ol/control/Attribution.js';
import {defaults as defaultControls} from '../src/ol/control/defaults.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';

const attribution = new Attribution({
  collapsible: false,
  attributions: `<a href="https://openlayers.org">I'm a static attribution. I never disappear</a>`,
});
const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  controls: defaultControls({attribution: false}).extend([attribution]),
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

document.getElementById('toggleLayerButton').addEventListener('click', () => {
  map.getLayers().forEach((l) => {
    l.setVisible(l.getVisible() ? false : true);
  });
});
