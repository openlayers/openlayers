import Draw from '../src/ol/interaction/Draw.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import Snap from '../src/ol/interaction/Snap.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import XYZ from '../src/ol/source/XYZ.js';

const raster = new TileLayer({
  source: new XYZ({
    url: 'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=get_your_own_D6rA4zTHduk6KOKTXzGB',
    maxZoom: 20,
  }),
});

// features in this layer will be snapped to
const baseVector = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'data/geojson/fire.json',
  }),
  style: {
    'fill-color': 'rgba(255, 0, 0, 0.3)',
    'stroke-color': 'rgba(255, 0, 0, 0.9)',
    'stroke-width': 0.5,
  },
});

// this is were the drawn features go
const drawVector = new VectorLayer({
  source: new VectorSource(),
  style: {
    'stroke-color': 'rgba(100, 255, 0, 1)',
    'stroke-width': 2,
    'fill-color': 'rgba(100, 255, 0, 0.3)',
  },
});

const map = new Map({
  layers: [raster, baseVector, drawVector],
  target: 'map',
  view: new View({
    center: [-13378949, 5943751],
    zoom: 11,
  }),
});

let drawInteraction;

const snapInteraction = new Snap({
  source: baseVector.getSource(),
});

const typeSelect = document.getElementById('type');

function addInteraction() {
  const value = typeSelect.value;
  if (value !== 'None') {
    drawInteraction = new Draw({
      type: value,
      source: drawVector.getSource(),
      trace: true,
      traceSource: baseVector.getSource(),
      style: {
        'stroke-color': 'rgba(255, 255, 100, 0.5)',
        'stroke-width': 1.5,
        'fill-color': 'rgba(255, 255, 100, 0.25)',
        'circle-radius': 6,
        'circle-fill-color': 'rgba(255, 255, 100, 0.5)',
      },
    });
    map.addInteraction(drawInteraction);
    map.addInteraction(snapInteraction);
  }
}

typeSelect.onchange = function () {
  map.removeInteraction(drawInteraction);
  map.removeInteraction(snapInteraction);
  addInteraction();
};
addInteraction();
