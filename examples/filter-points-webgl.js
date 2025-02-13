import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Point from '../src/ol/geom/Point.js';
import TileLayer from '../src/ol/layer/Tile.js';
import WebGLVectorLayer from '../src/ol/layer/WebGLVector.js';
import {fromLonLat} from '../src/ol/proj.js';
import StadiaMaps from '../src/ol/source/StadiaMaps.js';
import Vector from '../src/ol/source/Vector.js';

const vectorSource = new Vector({
  attributions: 'NASA',
});

const oldColor = 'rgba(242,56,22,0.61)';
const newColor = '#ffe52c';
const period = 12; // animation period in seconds
const animRatio = [
  '^',
  [
    '/',
    [
      '%',
      [
        '+',
        ['time'],
        ['interpolate', ['linear'], ['get', 'year'], 1850, 0, 2015, period],
      ],
      period,
    ],
    period,
  ],
  0.5,
];

const style = {
  'circle-radius': [
    '*',
    ['interpolate', ['linear'], ['get', 'mass'], 0, 4, 200000, 13],
    ['-', 1.75, ['*', animRatio, 0.75]],
  ],
  'circle-fill-color': [
    'interpolate',
    ['linear'],
    animRatio,
    0,
    newColor,
    1,
    oldColor,
  ],
  'circle-opacity': ['-', 1.0, ['*', animRatio, 0.75]],
};

// handle input values & events
const minYearInput = document.getElementById('min-year');
const maxYearInput = document.getElementById('max-year');

function updateStatusText() {
  const div = document.getElementById('status');
  div.querySelector('span.min-year').textContent = minYearInput.value;
  div.querySelector('span.max-year').textContent = maxYearInput.value;
}

const pointsLayer = new WebGLVectorLayer({
  variables: {
    minYear: parseInt(minYearInput.value),
    maxYear: parseInt(maxYearInput.value),
  },
  style: [
    {
      style,
      filter: [
        'between',
        ['get', 'year'],
        ['var', 'minYear'],
        ['var', 'maxYear'],
      ],
    },
  ],
  source: vectorSource,
  disableHitDetection: true,
});

minYearInput.addEventListener('input', function () {
  pointsLayer.updateStyleVariables({minYear: parseInt(minYearInput.value)});
  updateStatusText();
});
maxYearInput.addEventListener('input', function () {
  pointsLayer.updateStyleVariables({maxYear: parseInt(maxYearInput.value)});
  updateStatusText();
});
updateStatusText();

// load data;
const client = new XMLHttpRequest();
client.open('GET', 'data/csv/meteorite_landings.csv');
client.onload = function () {
  const csv = client.responseText;
  const features = [];

  let prevIndex = csv.indexOf('\n') + 1; // scan past the header line

  let curIndex;
  while ((curIndex = csv.indexOf('\n', prevIndex)) != -1) {
    const line = csv.substr(prevIndex, curIndex - prevIndex).split(',');
    prevIndex = curIndex + 1;

    const coords = fromLonLat([parseFloat(line[4]), parseFloat(line[3])]);
    if (isNaN(coords[0]) || isNaN(coords[1])) {
      // guard against bad data
      continue;
    }

    features.push(
      new Feature({
        mass: parseFloat(line[1]) || 0,
        year: parseInt(line[2]) || 0,
        geometry: new Point(coords),
      }),
    );
  }

  vectorSource.addFeatures(features);
};
client.send();

const map = new Map({
  layers: [
    new TileLayer({
      source: new StadiaMaps({
        layer: 'stamen_toner',
      }),
    }),
    pointsLayer,
  ],
  target: document.getElementById('map'),
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

// animate the map
function animate() {
  map.render();
  window.requestAnimationFrame(animate);
}
animate();
