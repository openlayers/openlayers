import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import WebGLPointsLayer from '../src/ol/layer/WebGLPoints.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import Vector from '../src/ol/source/Vector.js';
import OSM from '../src/ol/source/OSM.js';

const vectorSource = new Vector({
  url: 'data/geojson/world-cities.geojson',
  format: new GeoJSON()
});

let literalStyle = {
  symbol: {
    size: 4,
    color: '#3388FF',
    rotateWithView: false,
    offset: [0, 0],
    opacity: 1
  }
};
let pointsLayer;

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  target: document.getElementById('map'),
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

const editor = document.getElementById('style-editor');

function refreshLayer() {
  if (pointsLayer) {
    map.removeLayer(pointsLayer);
  }
  pointsLayer = new WebGLPointsLayer({
    source: vectorSource,
    style: literalStyle
  });
  map.addLayer(pointsLayer);
  editor.value = JSON.stringify(literalStyle, null, ' ');
}

function setStyleStatus(valid) {
  document.getElementById('style-valid').style.display = valid ? 'initial' : 'none';
  document.getElementById('style-invalid').style.display = !valid ? 'initial' : 'none';
}

editor.addEventListener('input', function() {
  try {
    literalStyle = JSON.parse(editor.value);
    refreshLayer();
    setStyleStatus(true);
  } catch (e) {
    setStyleStatus(false);
  }
});
refreshLayer();
