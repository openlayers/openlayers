import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import Feature from '../src/ol/Feature.js';
import Point from '../src/ol/geom/Point.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import {Vector} from '../src/ol/source.js';
import {fromLonLat} from '../src/ol/proj.js';
import WebGLPointsLayerRenderer from '../src/ol/renderer/webgl/PointsLayer.js';
import {clamp} from '../src/ol/math.js';
import Stamen from '../src/ol/source/Stamen.js';
import {formatColor} from '../src/ol/webgl/ShaderBuilder.js';

const vectorSource = new Vector({
  attributions: 'NASA'
});

const oldColor = [180, 140, 140];
const newColor = [255, 80, 80];

const startTime = Date.now() * 0.001;

// hanle input values & events
const minYearInput = document.getElementById('min-year');
const maxYearInput = document.getElementById('max-year');
function updateStatusText() {
  const div = document.getElementById('status');
  div.querySelector('span.min-year').textContent = minYearInput.value;
  div.querySelector('span.max-year').textContent = maxYearInput.value;
}
minYearInput.addEventListener('input', updateStatusText);
minYearInput.addEventListener('change', updateStatusText);
maxYearInput.addEventListener('input', updateStatusText);
maxYearInput.addEventListener('change', updateStatusText);
updateStatusText();

class WebglPointsLayer extends VectorLayer {
  createRenderer() {
    return new WebGLPointsLayerRenderer(this, {
      attributes: [
        {
          name: 'size',
          callback: function(feature) {
            return 18 * clamp(feature.get('mass') / 200000, 0, 1) + 8;
          }
        },
        {
          name: 'year',
          callback: function(feature) {
            return feature.get('year');
          }
        }
      ],
      vertexShader: [
        'precision mediump float;',

        'uniform mat4 u_projectionMatrix;',
        'uniform mat4 u_offsetScaleMatrix;',
        'uniform mat4 u_offsetRotateMatrix;',
        'attribute vec2 a_position;',
        'attribute float a_index;',
        'attribute float a_size;',
        'attribute float a_year;',
        'varying vec2 v_texCoord;',
        'varying float v_year;',

        'void main(void) {',
        '  mat4 offsetMatrix = u_offsetScaleMatrix;',
        '  float offsetX = a_index == 0.0 || a_index == 3.0 ? -a_size / 2.0 : a_size / 2.0;',
        '  float offsetY = a_index == 0.0 || a_index == 1.0 ? -a_size / 2.0 : a_size / 2.0;',
        '  vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);',
        '  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;',
        '  float u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 1.0;',
        '  float v = a_index == 0.0 || a_index == 1.0 ? 0.0 : 1.0;',
        '  v_texCoord = vec2(u, v);',
        '  v_year = a_year;',
        '}'
      ].join(' '),
      fragmentShader: [
        'precision mediump float;',

        'uniform float u_time;',
        'uniform float u_minYear;',
        'uniform float u_maxYear;',
        'varying vec2 v_texCoord;',
        'varying float v_year;',

        'void main(void) {',

        // filter out pixels if the year is outside of the given range
        '  if (v_year < u_minYear || v_year > u_maxYear) {',
        '    discard;',
        '  }',

        '  vec2 texCoord = v_texCoord * 2.0 - vec2(1.0, 1.0);',
        '  float sqRadius = texCoord.x * texCoord.x + texCoord.y * texCoord.y;',
        '  float value = 2.0 * (1.0 - sqRadius);',
        '  float alpha = smoothstep(0.0, 1.0, value);',

        // color is interpolated based on year
        '  float ratio = clamp((v_year - 1800.0) / (2013.0 - 1800.0), 0.0, 1.1);',
        '  vec3 color = mix(vec3(' + formatColor(oldColor) + '),',
        '    vec3(' + formatColor(newColor) + '), ratio);',

        '  float period = 8.0;',
        '  color.g *= 2.0 * (1.0 - sqrt(mod(u_time + v_year * 0.025, period) / period));',

        '  gl_FragColor = vec4(color, 1.0);',
        '  gl_FragColor.a *= alpha;',
        '  gl_FragColor.rgb *= gl_FragColor.a;',
        '}'
      ].join(' '),
      uniforms: {
        u_time: function() {
          return Date.now() * 0.001 - startTime;
        },
        u_minYear: function() {
          return parseInt(minYearInput.value);
        },
        u_maxYear: function() {
          return parseInt(maxYearInput.value);
        }
      }
    });
  }
}


function loadData() {
  const client = new XMLHttpRequest();
  client.open('GET', 'data/csv/meteorite_landings.csv');
  client.onload = function() {
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

      features.push(new Feature({
        mass: parseFloat(line[1]) || 0,
        year: parseInt(line[2]) || 0,
        geometry: new Point(coords)
      }));
    }

    vectorSource.addFeatures(features);
  };
  client.send();
}

loadData();

const map = new Map({
  layers: [
    new TileLayer({
      source: new Stamen({
        layer: 'toner'
      })
    }),
    new WebglPointsLayer({
      source: vectorSource
    })
  ],
  target: document.getElementById('map'),
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

// animate the map
function animate() {
  map.render();
  window.requestAnimationFrame(animate);
}
animate();
