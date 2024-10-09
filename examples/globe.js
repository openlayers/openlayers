import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileDebug from '../src/ol/source/TileDebug.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {useGeographic} from '../src/ol/proj.js';

useGeographic();

const layers = {};
layers['regions'] = new VectorLayer({
  opacity: 0.5,
  source: new VectorSource({
    url: 'https://openlayers.org/data/vector/ecoregions.json',
    format: new GeoJSON(),
  }),
  style: {
    'fill-color': ['string', ['get', 'COLOR'], '#eee'],
  },
  updateWhileAnimating: true,
  updateWhileInteracting: true,
  visible: false,
});

layers['cities'] = new VectorLayer({
  source: new VectorSource({
    url: 'data/geojson/world-cities.geojson',
    format: new GeoJSON(),
    wrapX: true,
  }),

  style: {
    'icon-src': 'data/icon.png',
  },
  updateWhileAnimating: true,
  updateWhileInteracting: true,
  visible: false,
});

layers['debug'] = new TileLayer({
  source: new TileDebug(),
  visible: false,
});

const view = new View({
  center: [135, 35],
  zoom: 5,
  projection: 'globe',
});

new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    ...Object.values(layers),
  ],
  target: 'map',
  view,
});

const layerNames = ['debug', 'regions', 'cities'];
layerNames.forEach((name) => {
  const obj = document.getElementById(name);
  obj.addEventListener('change', (e) =>
    layers[name].setVisible(e.target.checked),
  );
  layers[name].setVisible(obj.checked);
});

const tiltObj = document.getElementById('tilt');
tiltObj.addEventListener('input', (e) => {
  view.setTilt((Number(e.target.value) / 180) * Math.PI);
});
view.setTilt((Number(tiltObj.value) / 180) * Math.PI);
