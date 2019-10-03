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

const predefinedStyles = {
  'icons': {
    symbol: {
      symbolType: 'image',
      src: 'data/icon.png',
      size: [18, 28],
      color: 'lightyellow',
      rotateWithView: false,
      offset: [0, 9]
    }
  },
  'triangles': {
    symbol: {
      symbolType: 'triangle',
      size: 18,
      color: [
        ['stretch', ['get', 'population'], 20000, 300000, 0.1, 1.0],
        ['stretch', ['get', 'population'], 20000, 300000, 0.6, 0.3],
        0.6,
        1.0
      ],
      rotateWithView: true
    }
  },
  'circles': {
    symbol: {
      symbolType: 'circle',
      size: ['stretch', ['get', 'population'], 40000, 2000000, 8, 28],
      color: '#006688',
      rotateWithView: false,
      offset: [0, 0],
      opacity: ['stretch', ['get', 'population'], 40000, 2000000, 0.6, 0.92]
    }
  }
};

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

let literalStyle;
let pointsLayer;
function refreshLayer(newStyle) {
  const previousLayer = pointsLayer;
  pointsLayer = new WebGLPointsLayer({
    source: vectorSource,
    style: newStyle
  });
  map.addLayer(pointsLayer);

  if (previousLayer) {
    map.removeLayer(previousLayer);
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
editor.addEventListener('input', function() {
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
