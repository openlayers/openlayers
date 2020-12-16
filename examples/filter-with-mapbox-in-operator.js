import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import Point from '../src/ol/geom/Point.js';
import Stamen from '../src/ol/source/Stamen.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import WebGLPointsLayer from '../src/ol/layer/WebGLPoints.js';
import {Vector} from '../src/ol/source.js';
import {fromLonLat} from '../src/ol/proj.js';

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
  variables: {
    decade: [1850, 1851, 1852, 1853, 1854, 1855, 1856, 1857, 1858, 1859],
  },
  filter: [
    'in',
    ['get', 'year'],
    [1850, 1851, 1852, 1853, 1854, 1855, 1856, 1857, 1858, 1859],
  ],
  symbol: {
    symbolType: 'circle',
    size: [
      '*',
      ['interpolate', ['linear'], ['get', 'mass'], 0, 8, 200000, 26],
      ['-', 1.75, ['*', animRatio, 0.75]],
    ],
    color: ['interpolate', ['linear'], animRatio, 0, newColor, 1, oldColor],
    opacity: ['-', 1.0, ['*', animRatio, 0.75]],
  },
};

// load data
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
      })
    );
  }

  vectorSource.addFeatures(features);
};
client.send();

const map = new Map({
  layers: [
    new TileLayer({
      source: new Stamen({
        layer: 'toner',
      }),
    }),
  ],
  target: document.getElementById('map'),
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

// handle input values & events
const decadeInput = document.getElementById('decade');

function updateDecade() {
  const yearVal = parseInt(decadeInput.value);
  const yearArr = [yearVal];
  for (let i = 1; i < 10; i++) {
    yearArr.push(yearVal + i);
  }
  style.variables.decade = yearArr;
  style.filter = ['in', ['get', 'year'], yearArr];
  refreshLayer();
  updateStatusText();
}
function updateStatusText() {
  const div = document.getElementById('status');
  div.querySelector('span.decade').textContent = decadeInput.value;
}

decadeInput.addEventListener('input', updateDecade);
decadeInput.addEventListener('change', updateDecade);
updateStatusText();

let pointsLayer;
function refreshLayer() {
  const previousLayer = pointsLayer;
  pointsLayer = new WebGLPointsLayer({
    style: style,
    source: vectorSource,
    disableHitDetection: true,
  });
  map.addLayer(pointsLayer);

  if (previousLayer) {
    map.removeLayer(previousLayer);
    previousLayer.dispose();
  }
}

refreshLayer();

// animate the map
function animate() {
  map.render();
  window.requestAnimationFrame(animate);
}
animate();
