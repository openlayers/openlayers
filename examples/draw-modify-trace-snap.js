import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import Draw from '../src/ol/interaction/Draw.js';
import Modify from '../src/ol/interaction/Modify.js';
import Snap from '../src/ol/interaction/Snap.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import ImageTile from '../src/ol/source/ImageTile.js';
import VectorSource from '../src/ol/source/Vector.js';

const raster = new TileLayer({
  source: new ImageTile({
    url: 'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=get_your_own_D6rA4zTHduk6KOKTXzGB',
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

// this is where the drawn features go
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
    maxZoom: 23,
  }),
});

let drawInteraction;

const snapInteraction = new Snap({
  source: baseVector.getSource(),
});

const modifyInteraction = new Modify({
  source: drawVector.getSource(),
  trace: true,
  traceSource: baseVector.getSource(),
});

const typeSelect = document.getElementById('type');

function addInteraction() {
  const value = typeSelect.value;
  map.addInteraction(modifyInteraction);
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
    drawInteraction.once('drawend', () => {
      typeSelect.value = 'None';
      setTimeout(changeDrawMode, 0);
    });
    map.addInteraction(drawInteraction);
  }
  map.addInteraction(snapInteraction);
}

function changeDrawMode() {
  if (drawInteraction) {
    map.removeInteraction(drawInteraction);
    drawInteraction = null;
  }
  map.removeInteraction(modifyInteraction);
  map.removeInteraction(snapInteraction);
  addInteraction();
}
typeSelect.onchange = changeDrawMode;
addInteraction();
