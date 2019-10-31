import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import TileJSON from '../src/ol/source/TileJSON.js';
import Feature from '../src/ol/Feature.js';
import Point from '../src/ol/geom/Point.js';
import {Vector} from '../src/ol/source.js';
import {fromLonLat} from '../src/ol/proj.js';
import WebGLPointsLayer from '../src/ol/layer/WebGLPoints.js';

const key = 'pk.eyJ1IjoidHNjaGF1YiIsImEiOiJjaW5zYW5lNHkxMTNmdWttM3JyOHZtMmNtIn0.CDIBD8H-G2Gf-cPkIuWtRg';

const map = new Map({
  layers: [
    new TileLayer({
      source: new TileJSON({
        url: 'https://api.tiles.mapbox.com/v4/mapbox.world-dark.json?secure&access_token=' + key,
        crossOrigin: 'anonymous'
      })
    })
  ],
  target: document.getElementById('map'),
  view: new View({
    center: [0, 4000000],
    zoom: 2
  })
});

const vectorSource = new Vector({
  features: [],
  attributions: 'National UFO Reporting Center'
});

const oldColor = [255, 160, 110];
const newColor = [180, 255, 200];
const size = 16;

const style = {
  variables: {
    filterShape: 'all'
  },
  filter: [
    'case',
    ['!=', ['var', 'filterShape'], 'all'],
    ['==', ['get', 'shape'], ['var', 'filterShape']],
    true
  ],
  symbol: {
    symbolType: 'image',
    src: 'data/ufo_shapes.png',
    size: size,
    color: [
      'interpolate',
      ['linear'],
      ['get', 'year'],
      1950, oldColor,
      2013, newColor
    ],
    rotateWithView: false,
    offset: [
      0,
      0
    ],
    textureCoord: [
      'match',
      ['get', 'shape'],
      'light', [0, 0, 0.25, 0.5],
      'sphere', [0.25, 0, 0.5, 0.5],
      'circle', [0.25, 0, 0.5, 0.5],
      'disc', [0.5, 0, 0.75, 0.5],
      'oval', [0.5, 0, 0.75, 0.5],
      'triangle', [0.75, 0, 1, 0.5],
      'fireball', [0, 0.5, 0.25, 1],
      [0.75, 0.5, 1, 1]
    ]
  }
};

// key is shape name, value is sightings count
const shapeTypes = {
  all: 0
};
const shapeSelect = document.getElementById('shape-filter');
shapeSelect.addEventListener('input', function() {
  style.variables.filterShape = shapeSelect.options[shapeSelect.selectedIndex].value;
  map.render();
});
function fillShapeSelect() {
  Object.keys(shapeTypes)
    .sort(function(a, b) {
      return shapeTypes[b] - shapeTypes[a];
    })
    .forEach(function(shape) {
      const option = document.createElement('option');
      option.text = `${shape} (${shapeTypes[shape]} sightings)`;
      option.value = shape;
      shapeSelect.appendChild(option);
    });
}

const client = new XMLHttpRequest();
client.open('GET', 'data/csv/ufo_sighting_data.csv');
client.onload = function() {
  const csv = client.responseText;
  const features = [];

  let prevIndex = csv.indexOf('\n') + 1; // scan past the header line

  let curIndex;
  while ((curIndex = csv.indexOf('\n', prevIndex)) != -1) {
    const line = csv.substr(prevIndex, curIndex - prevIndex).split(',');
    prevIndex = curIndex + 1;

    const coords = fromLonLat([parseFloat(line[5]), parseFloat(line[4])]);

    // only keep valid points
    if (isNaN(coords[0]) || isNaN(coords[1])) {
      continue;
    }

    const shape = line[2];
    shapeTypes[shape] = (shapeTypes[shape] ? shapeTypes[shape] : 0) + 1;
    shapeTypes['all']++;

    features.push(new Feature({
      datetime: line[0],
      year: parseInt(/[0-9]{4}/.exec(line[0])[0]), // extract the year as int
      shape: shape,
      duration: line[3],
      geometry: new Point(coords)
    }));
  }
  vectorSource.addFeatures(features);
  fillShapeSelect();
};
client.send();

map.addLayer(
  new WebGLPointsLayer({
    source: vectorSource,
    style: style
  })
);

const info = document.getElementById('info');
map.on('pointermove', function(evt) {
  if (map.getView().getInteracting() || map.getView().getAnimating()) {
    return;
  }
  const pixel = evt.pixel;
  info.innerText = '';
  map.forEachFeatureAtPixel(pixel, function(feature) {
    const datetime = feature.get('datetime');
    const duration = feature.get('duration');
    const shape = feature.get('shape');
    info.innerText = 'On ' + datetime + ', lasted ' + duration + ' seconds and had a "' + shape + '" shape.';
  });
});
