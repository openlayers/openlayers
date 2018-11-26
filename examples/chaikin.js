import Map from 'ol/Map';
import View from 'ol/View';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {OSM, Vector as VectorSource} from 'ol/source';
import Draw from 'ol/interaction/Draw';

import smooth from 'chaikin-smooth';

function makeSmooth(path, numIterations) {
  numIterations = Math.min(Math.max(numIterations, 1), 10);
  while (numIterations > 0) {
    path = smooth(path);
    numIterations--;
  }
  return path;
}

const vectorSource = new VectorSource({});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
      opacity: 0.5
    }),
    new VectorLayer({
      source: vectorSource
    })
  ],
  target: 'map',
  view: new View({
    center: [1078373.5950, 6871994.5910],
    zoom: 5
  })
});

const shallSmoothen = document.getElementById('shall-smoothen');
const numIterations = document.getElementById('iterations');

const draw = new Draw({
  source: vectorSource,
  type: 'LineString'
});
map.addInteraction(draw);
draw.on('drawend', function(event) {
  if (!shallSmoothen.checked) {
    return;
  }
  const feat = event.feature;
  const geometry = feat.getGeometry();
  const coords = geometry.getCoordinates();
  const smoothened = makeSmooth(coords, parseInt(numIterations.value, 10) || 5);
  geometry.setCoordinates(smoothened);
});
