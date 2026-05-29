import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Point from '../src/ol/geom/Point.js';
import TileLayer from '../src/ol/layer/Tile.js';
import WebGLVectorLayer from '../src/ol/layer/WebGLVector.js';
import {fromLonLat} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';
import Vector from '../src/ol/source/Vector.js';

const feature = new Feature({
  geometry: new Point(fromLonLat([0, 0])),
  label: 'OpenLayers',
});

const vectorSource = new Vector({wrapX: true, features: [feature]});

/**
 * @param {string} hex Hex color (#rrggbb).
 * @param {string|number} alpha Alpha in [0, 1].
 * @return {Array<number>} Normalized rgba in [0, 1].
 */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b, parseFloat(alpha)];
}

// Fill/outline color and outline width are style variables, so they update
// live; the font (family/weight/size) is applied through `text-font` and
// changing it rebuilds the style.
const layer = new WebGLVectorLayer({
  source: vectorSource,
  variables: {
    fillColor: [1, 1, 0, 1],
    outlineColor: [1, 0, 0, 1],
    outlineWidth: 2,
  },
  style: buildStyle('sans-serif', 'normal', 48),
});

/**
 * @param {string} family Font family.
 * @param {string} weight Font weight.
 * @param {number} size Font size in px.
 * @return {Object} Flat style.
 */
function buildStyle(family, weight, size) {
  return {
    'text-value': ['get', 'label'],
    'text-font': `${weight} ${size}px ${family}`,
    'text-fill-color': ['var', 'fillColor'],
    'text-stroke-color': ['var', 'outlineColor'],
    'text-stroke-width': ['var', 'outlineWidth'],
  };
}

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
      opacity: 0.5,
    }),
    layer,
  ],
  target: 'map',
  view: new View({
    center: fromLonLat([0, 0]),
    zoom: 4,
  }),
});

function readFont() {
  return {
    family: document.getElementById('fontFamily').value,
    weight: document.getElementById('fontWeight').value,
    size: parseFloat(document.getElementById('textSize').value),
  };
}

// Font changes require a new text-font string, which rebuilds the style.
function updateFont() {
  const font = readFont();
  document.getElementById('textSizeVal').textContent = font.size;
  layer.setStyle(buildStyle(font.family, font.weight, font.size));
}

// Text + visibility only change feature data, so the label updates in place.
function updateText() {
  const text = document.getElementById('textInput').value;
  const visible = document.getElementById('visibility').checked;
  feature.set('label', visible ? text : '');
}

// Colors and outline width are style variables: live update, no rebuild.
function updateColors() {
  const fillWidth = parseFloat(document.getElementById('outlineWidth').value);
  document.getElementById('outlineWidthVal').textContent = fillWidth;
  layer.updateStyleVariables({
    fillColor: hexToRgba(
      document.getElementById('fillColor').value,
      document.getElementById('fillAlpha').value,
    ),
    outlineColor: hexToRgba(
      document.getElementById('outlineColor').value,
      document.getElementById('outlineAlpha').value,
    ),
    outlineWidth: fillWidth,
  });
}

['fontFamily', 'fontWeight', 'textSize'].forEach((id) => {
  document.getElementById(id).addEventListener('input', updateFont);
});
['textInput', 'visibility'].forEach((id) => {
  document.getElementById(id).addEventListener('input', updateText);
});
[
  'fillColor',
  'fillAlpha',
  'outlineColor',
  'outlineAlpha',
  'outlineWidth',
].forEach((id) => {
  document.getElementById(id).addEventListener('input', updateColors);
});

updateColors();
