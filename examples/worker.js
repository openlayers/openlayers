/* eslint-disable no-console */

import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';
import {create as createVersionWorker} from '../src/ol/worker/version.js';


const map = new Map({
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

const worker = createVersionWorker();
worker.addEventListener('error', function(error) {
  console.error('worker error', error);
});

worker.addEventListener('message', function(event) {
  console.log('message from worker:', event.data);
});

map.on('moveend', function(event) {
  const state = event.frameState.viewState;
  worker.postMessage({zoom: state.zoom, center: state.center});
});
