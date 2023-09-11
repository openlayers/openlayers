import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {DEVICE_PIXEL_RATIO} from '../src/ol/has.js';
import {Fill, Style} from '../src/ol/style.js';
import {fromLonLat} from '../src/ol/proj.js';

// Gradient and pattern are in canvas pixel space, so we adjust for the
// renderer's pixel ratio
const pixelRatio = DEVICE_PIXEL_RATIO;

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

const createPatternMethods = {
  linear: function (color1, color2) {
    // set equal width and height for diagonal gradient
    // set width or height 0 for horizontal or vertical gradient
    const width = 8 * pixelRatio;
    const height = width;
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(2 / 16, color1);
    gradient.addColorStop(3 / 16, color2);
    gradient.addColorStop(5 / 16, color2);
    gradient.addColorStop(6 / 16, color1);
    gradient.addColorStop(10 / 16, color1);
    gradient.addColorStop(11 / 16, color2);
    gradient.addColorStop(13 / 16, color2);
    gradient.addColorStop(14 / 16, color1);
    canvas.width = Math.max(width, 1);
    canvas.height = Math.max(height, 1);
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    return context.createPattern(canvas, 'repeat');
  },

  radial: function (color1, color2) {
    const radius = 4 * pixelRatio;
    const gradient = context.createRadialGradient(
      radius,
      radius,
      0,
      radius,
      radius,
      radius
    );
    gradient.addColorStop(3 / 8, color2);
    gradient.addColorStop(5 / 8, color1);
    canvas.width = radius * 2;
    canvas.height = radius * 2;
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    return context.createPattern(canvas, 'repeat');
  },
};

let createPatternFunction, styleCache;

const vectorLayer = new VectorLayer({
  background: '#1a2b39',
  source: new VectorSource({
    url: 'https://openlayers.org/data/vector/ecoregions.json',
    format: new GeoJSON(),
  }),

  style: function (feature) {
    const bioColor = feature.get('COLOR_BIO') || '#eee';
    const nnhColor = feature.get('COLOR_NNH') || '#eee';

    let style = styleCache[bioColor]?.[nnhColor];
    if (!style) {
      style = new Style({
        fill: new Fill({color: createPatternFunction(bioColor, nnhColor)}),
      });
      if (!styleCache[bioColor]) {
        styleCache[bioColor] = {};
      }
      styleCache[bioColor][nnhColor] = style;
    }
    return style;
  },
});

const typeSelect = document.getElementById('type');
typeSelect.onchange = function () {
  createPatternFunction = createPatternMethods[typeSelect.value];
  styleCache = {};
  vectorLayer.changed();
};
typeSelect.onchange();

const map = new Map({
  layers: [vectorLayer],
  target: 'map',
  view: new View({
    center: fromLonLat([-100, 38.5]),
    zoom: 4,
  }),
});

const displayFeatureInfo = function (pixel) {
  const feature = map.forEachFeatureAtPixel(pixel, function (feature) {
    return feature;
  });

  const info = document.getElementById('info');

  info.innerHTML =
    (feature?.get('BIOME_NAME') || '&nbsp;') +
    '<br>' +
    (feature?.get('NNH_NAME') || '&nbsp;');
};

map.on(['click', 'pointermove'], function (evt) {
  if (evt.dragging) {
    return;
  }
  displayFeatureInfo(evt.pixel);
});
