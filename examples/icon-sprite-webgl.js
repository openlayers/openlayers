import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import TileJSON from '../src/ol/source/TileJSON.js';
import Feature from '../src/ol/Feature.js';
import Point from '../src/ol/geom/Point.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import {Vector} from '../src/ol/source.js';
import {fromLonLat} from '../src/ol/proj.js';
import WebGLPointsLayerRenderer from '../src/ol/renderer/webgl/PointsLayer.js';
import {formatColor, formatNumber} from '../src/ol/webgl/ShaderBuilder.js';

const key = 'pk.eyJ1IjoidHNjaGF1YiIsImEiOiJjaW5zYW5lNHkxMTNmdWttM3JyOHZtMmNtIn0.CDIBD8H-G2Gf-cPkIuWtRg';

const vectorSource = new Vector({
  features: [],
  attributions: 'National UFO Reporting Center'
});

const texture = new Image();
texture.src = 'data/ufo_shapes.png';

// This describes the content of the associated sprite sheet
// coords are u0, v0 for a given shape (all icons have a size of 0.25 x 0.5)
const shapeTextureCoords = {
  'light': [0, 0],
  'sphere': [0.25, 0],
  'circle': [0.25, 0],
  'disc': [0.5, 0],
  'oval': [0.5, 0],
  'triangle': [0.75, 0],
  'fireball': [0, 0.5],
  'default': [0.75, 0.5]
};

const oldColor = [255, 160, 110];
const newColor = [180, 255, 200];
const size = 16;

class WebglPointsLayer extends VectorLayer {
  createRenderer() {
    return new WebGLPointsLayerRenderer(this, {
      attributes: [
        {
          name: 'year',
          callback: function(feature) {
            return feature.get('year');
          }
        },
        {
          name: 'texCoordU',
          callback: function(feature) {
            let coords = shapeTextureCoords[feature.get('shape')];
            if (!coords) {
              coords = shapeTextureCoords['default'];
            }
            return coords[0];
          }
        },
        {
          name: 'texCoordV',
          callback: function(feature) {
            let coords = shapeTextureCoords[feature.get('shape')];
            if (!coords) {
              coords = shapeTextureCoords['default'];
            }
            return coords[1];
          }
        }
      ],
      uniforms: {
        u_texture: texture
      },
      vertexShader: [
        'precision mediump float;',

        'uniform mat4 u_projectionMatrix;',
        'uniform mat4 u_offsetScaleMatrix;',
        'uniform mat4 u_offsetRotateMatrix;',
        'attribute vec2 a_position;',
        'attribute float a_index;',
        'attribute float a_year;',
        'attribute float a_texCoordU;',
        'attribute float a_texCoordV;',
        'varying vec2 v_texCoord;',
        'varying float v_year;',

        'void main(void) {',
        '  mat4 offsetMatrix = u_offsetScaleMatrix;',
        '  float offsetX = a_index == 0.0 || a_index == 3.0 ? ',
        '    ' + formatNumber(-size / 2) + ' : ' + formatNumber(size / 2) + ';',
        '  float offsetY = a_index == 0.0 || a_index == 1.0 ? ',
        '    ' + formatNumber(-size / 2) + ' : ' + formatNumber(size / 2) + ';',
        '  vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);',
        '  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;',
        '  float u = a_index == 0.0 || a_index == 3.0 ? a_texCoordU : a_texCoordU + 0.25;',
        '  float v = a_index == 2.0 || a_index == 3.0 ? a_texCoordV : a_texCoordV + 0.5;',
        '  v_texCoord = vec2(u, v);',
        '  v_year = a_year;',
        '}'
      ].join(' '),
      fragmentShader: [
        'precision mediump float;',

        'uniform float u_time;',
        'uniform float u_minYear;',
        'uniform float u_maxYear;',
        'uniform sampler2D u_texture;',
        'varying vec2 v_texCoord;',
        'varying float v_year;',

        'void main(void) {',
        '  vec4 textureColor = texture2D(u_texture, v_texCoord);',
        '  if (textureColor.a < 0.1) {',
        '    discard;',
        '  }',

        // color is interpolated based on year
        '  float ratio = clamp((v_year - 1950.0) / (2013.0 - 1950.0), 0.0, 1.1);',
        '  vec3 color = mix(vec3(' + formatColor(oldColor) + '),',
        '    vec3(' + formatColor(newColor) + '), ratio);',

        '  gl_FragColor = vec4(color, 1.0) * textureColor;',
        '  gl_FragColor.rgb *= gl_FragColor.a;',
        '}'
      ].join(' '),
      hitVertexShader: [
        'precision mediump float;',

        'uniform mat4 u_projectionMatrix;',
        'uniform mat4 u_offsetScaleMatrix;',
        'uniform mat4 u_offsetRotateMatrix;',
        'attribute vec2 a_position;',
        'attribute float a_index;',
        'attribute vec4 a_hitColor;',
        'attribute float a_texCoordU;',
        'attribute float a_texCoordV;',
        'varying vec2 v_texCoord;',
        'varying vec4 v_hitColor;',

        'void main(void) {',
        '  mat4 offsetMatrix = u_offsetScaleMatrix;',
        '  float offsetX = a_index == 0.0 || a_index == 3.0 ? ',
        '    ' + formatNumber(-size / 2) + ' : ' + formatNumber(size / 2) + ';',
        '  float offsetY = a_index == 0.0 || a_index == 1.0 ? ',
        '    ' + formatNumber(-size / 2) + ' : ' + formatNumber(size / 2) + ';',
        '  vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);',
        '  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;',
        '  float u = a_index == 0.0 || a_index == 3.0 ? a_texCoordU : a_texCoordU + 0.25;',
        '  float v = a_index == 2.0 || a_index == 3.0 ? a_texCoordV : a_texCoordV + 0.5;',
        '  v_texCoord = vec2(u, v);',
        '  v_hitColor = a_hitColor;',
        '}'
      ].join(' '),
      hitFragmentShader: [
        'precision mediump float;',

        'uniform sampler2D u_texture;',
        'varying vec2 v_texCoord;',
        'varying vec4 v_hitColor;',

        'void main(void) {',
        '  vec4 textureColor = texture2D(u_texture, v_texCoord);',
        '  if (textureColor.a < 0.1) {',
        '    discard;',
        '  }',

        '  gl_FragColor = v_hitColor;',
        '}'
      ].join(' ')
    });
  }
}


function loadData() {
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

      features.push(new Feature({
        datetime: line[0],
        year: parseInt(/[0-9]{4}/.exec(line[0])[0]), // extract the year as int
        shape: line[2],
        duration: line[3],
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
      source: new TileJSON({
        url: 'https://api.tiles.mapbox.com/v4/mapbox.world-dark.json?secure&access_token=' + key,
        crossOrigin: 'anonymous'
      })
    }),
    new WebglPointsLayer({
      source: vectorSource
    })
  ],
  target: document.getElementById('map'),
  view: new View({
    center: [0, 4000000],
    zoom: 2
  })
});

const info = document.getElementById('info');
map.on('pointermove', function(evt) {
  if (map.getView().getInteracting()) {
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

texture.addEventListener('load', function() {
  map.render();
});
