import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import TileLayer from '../src/ol/layer/Tile.js';
import WebGLVectorLayer from '../src/ol/layer/WebGLVector.js';
import OSM from '../src/ol/source/OSM.js';
import Vector from '../src/ol/source/Vector.js';

const vectorSource = new Vector({
  url: 'data/geojson/world-cities.geojson',
  format: new GeoJSON(),
  wrapX: true,
});

const predefinedStyles = {
  icons: {
    'icon-src': 'data/icon.png',
    'icon-width': 18,
    'icon-height': 28,
    'icon-color': 'lightyellow',
    'icon-rotate-with-view': false,
    'icon-displacement': [0, 9],
  },
  triangles: {
    'shape-points': 3,
    'shape-radius': 9,
    'shape-fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'population'],
      20000,
      '#5aca5b',
      300000,
      '#ff6a19',
    ],
    'shape-rotate-with-view': true,
  },
  'triangles-latitude': {
    'shape-points': 3,
    'shape-radius': [
      'interpolate',
      ['linear'],
      ['get', 'population'],
      40000,
      6,
      2000000,
      12,
    ],
    'shape-fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'latitude'],
      -60,
      '#ff14c3',
      -20,
      '#ff621d',
      20,
      '#ffed02',
      60,
      '#00ff67',
    ],
    'shape-opacity': 0.95,
  },
  circles: {
    'circle-radius': [
      'interpolate',
      ['linear'],
      ['get', 'population'],
      40000,
      4,
      2000000,
      14,
    ],
    'circle-fill-color': ['match', ['get', 'hover'], 1, '#ff3f3f', '#006688'],
    'circle-rotate-with-view': false,
    'circle-displacement': [0, 0],
    'circle-opacity': [
      'interpolate',
      ['linear'],
      ['get', 'population'],
      40000,
      0.6,
      2000000,
      0.92,
    ],
  },
  'circles-zoom': {
    // by using an exponential interpolation with a base of 2 we can make it so that circles will have a fixed size
    // in world coordinates between zoom level 5 and 15
    'circle-radius': [
      'interpolate',
      ['exponential', 2],
      ['zoom'],
      5,
      1.5,
      15,
      1.5 * Math.pow(2, 10),
    ],
    'circle-fill-color': ['match', ['get', 'hover'], 1, '#ff3f3f', '#006688'],
    'circle-displacement': [0, 0],
    'circle-opacity': 0.95,
  },
  'rotating-bars': {
    'shape-rotation': ['*', ['time'], 0.13],
    'shape-points': 4,
    'shape-radius': 4,
    'shape-radius2': 4 * Math.sqrt(2),
    'shape-scale': [
      'array',
      1,
      ['interpolate', ['linear'], ['get', 'population'], 20000, 1, 300000, 7],
    ],
    'shape-fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'population'],
      20000,
      '#ffdc00',
      300000,
      '#ff5b19',
    ],
    'shape-displacement': [
      'array',
      0,
      ['interpolate', ['linear'], ['get', 'population'], 20000, 2, 300000, 14],
    ],
  },
};

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  target: document.getElementById('map'),
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

let literalStyle;
let pointsLayer;

let selected = null;

map.on('pointermove', function (ev) {
  if (selected !== null) {
    selected.set('hover', 0);
    selected = null;
  }

  map.forEachFeatureAtPixel(ev.pixel, function (feature) {
    feature.set('hover', 1);
    selected = feature;
    return true;
  });
});

function refreshLayer(newStyle) {
  const previousLayer = pointsLayer;
  pointsLayer = new WebGLVectorLayer({
    source: vectorSource,
    style: newStyle,
  });
  map.addLayer(pointsLayer);

  if (previousLayer) {
    map.removeLayer(previousLayer);
    previousLayer.dispose();
  }
  literalStyle = newStyle;
}

const spanValid = document.getElementById('style-valid');
const spanInvalid = document.getElementById('style-invalid');
function setStyleStatus(errorMsg) {
  const isError = typeof errorMsg === 'string';
  spanValid.style.display = errorMsg === null ? 'initial' : 'none';
  spanInvalid.firstElementChild.innerText = isError ? errorMsg : '';
  spanInvalid.style.display = isError ? 'initial' : 'none';
}

const editor = document.getElementById('style-editor');
editor.addEventListener('input', function () {
  const textStyle = editor.value;
  try {
    const newLiteralStyle = JSON.parse(textStyle);
    if (JSON.stringify(newLiteralStyle) !== JSON.stringify(literalStyle)) {
      refreshLayer(newLiteralStyle);
    }
    setStyleStatus(null);
  } catch (e) {
    setStyleStatus(e.message);
  }
});

const select = document.getElementById('style-select');
select.value = 'circles';
function onSelectChange() {
  const style = select.value;
  const newLiteralStyle = predefinedStyles[style];
  editor.value = JSON.stringify(newLiteralStyle, null, 2);
  try {
    refreshLayer(newLiteralStyle);
    setStyleStatus();
  } catch (e) {
    setStyleStatus(e.message);
  }
}
onSelectChange();
select.addEventListener('change', onSelectChange);

// animate the map
function animate() {
  map.render();
  window.requestAnimationFrame(animate);
}
animate();
