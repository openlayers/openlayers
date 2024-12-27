import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import WebGLVectorLayer from '../src/ol/layer/WebGLVector.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';

/** @type {import('../src/ol/style/flat.js').FlatStyleLike} */
const style = [
  {
    filter: ['==', ['var', 'highlightedId'], ['id']],
    style: {
      'stroke-color': 'white',
      'stroke-width': 3,
      'stroke-offset': -1,
      'fill-color': [255, 255, 255, 0.4],
    },
  },
  {
    else: true,
    style: {
      'stroke-color': ['*', ['get', 'COLOR'], [220, 220, 220]],
      'stroke-width': 2,
      'stroke-offset': -1,
      'fill-color': ['*', ['get', 'COLOR'], [255, 255, 255, 0.6]],
    },
  },
];

const osm = new TileLayer({
  source: new OSM(),
});

const vectorLayer = new WebGLVectorLayer({
  source: new VectorSource({
    url: 'https://openlayers.org/data/vector/ecoregions.json',
    format: new GeoJSON(),
  }),
  style,
  variables: {
    highlightedId: -1,
  },
});

const map = new Map({
  layers: [osm, vectorLayer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});

let highlightedId = -1;
const displayFeatureInfo = function (pixel) {
  const feature = map.forEachFeatureAtPixel(pixel, function (feature) {
    return feature;
  });

  const info = document.getElementById('info');
  if (feature) {
    info.innerHTML = feature.get('ECO_NAME') || '&nbsp;';
  } else {
    info.innerHTML = '&nbsp;';
  }

  const id = feature ? feature.getId() : -1;
  if (id !== highlightedId) {
    highlightedId = id;
    vectorLayer.updateStyleVariables({highlightedId});
  }
};

map.on('pointermove', function (evt) {
  if (evt.dragging) {
    return;
  }
  displayFeatureInfo(evt.pixel);
});

map.on('click', function (evt) {
  displayFeatureInfo(evt.pixel);
});
