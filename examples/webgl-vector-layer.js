import GeoJSON from '../src/ol/format/GeoJSON.js';
import Layer from '../src/ol/layer/Layer.js';
import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import WebGLVectorLayerRenderer from '../src/ol/renderer/webgl/VectorLayer.js';
import {asArray} from '../src/ol/color.js';

class WebGLLayer extends Layer {
  createRenderer() {
    return new WebGLVectorLayerRenderer(this, {
      className: this.getClassName(),
      polygonVertexShader: `
        precision mediump float;
        uniform mat4 u_projectionMatrix;
        attribute vec2 a_position;
        attribute float a_color;

        varying vec3 v_color;

        void main(void) {
          gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0);
          v_color = vec3(
            floor(a_color / 256.0 / 256.0) / 256.0,
            fract(floor(a_color / 256.0) / 256.0),
            fract(a_color / 256.0)
          );
        }`,
      polygonFragmentShader: `
        precision mediump float;
        varying vec3 v_color;

        void main(void) {
          gl_FragColor = vec4(v_color.rgb, 1.0);
          gl_FragColor *= 0.75;
        }`,
      lineStringVertexShader: `
        precision mediump float;
        uniform mat4 u_projectionMatrix;
        uniform vec2 u_sizePx;
        attribute vec2 a_segmentStart;
        attribute vec2 a_segmentEnd;
        attribute float a_parameters;
        attribute float a_color;
        varying vec2 v_segmentStart;
        varying vec2 v_segmentEnd;
        varying float v_angleStart;
        varying float v_angleEnd;

        varying vec3 v_color;

        vec2 worldToPx(vec2 worldPos) {
          vec4 screenPos = u_projectionMatrix * vec4(worldPos, 0.0, 1.0);
          return (0.5 * screenPos.xy + 0.5) * u_sizePx;
        }

        vec4 pxToScreen(vec2 pxPos) {
          vec2 screenPos = pxPos * 4.0 / u_sizePx;
          return vec4(screenPos.xy, 0.0, 0.0);
        }

        vec2 getOffsetDirection(vec2 normalPx, vec2 tangentPx, float joinAngle) {
          if (cos(joinAngle) > 0.93) return normalPx - tangentPx;
          float halfAngle = joinAngle / 2.0;
          vec2 angleBisectorNormal = vec2(
            sin(halfAngle) * normalPx.x + cos(halfAngle) * normalPx.y,
            -cos(halfAngle) * normalPx.x + sin(halfAngle) * normalPx.y
          );
          float length = 1.0 / sin(halfAngle);
          return angleBisectorNormal * length;
        }

        float lineWidth = 2.0;

        void main(void) {
          float anglePrecision = 1500.0;
          float paramShift = 10000.0;
          v_angleStart = fract(a_parameters / paramShift) * paramShift / anglePrecision;
          v_angleEnd = fract(floor(a_parameters / paramShift + 0.5) / paramShift) * paramShift / anglePrecision;
          float vertexNumber = floor(a_parameters / paramShift / paramShift + 0.0001);
          vec2 tangentPx = worldToPx(a_segmentEnd) - worldToPx(a_segmentStart);
          tangentPx = normalize(tangentPx);
          vec2 normalPx = vec2(-tangentPx.y, tangentPx.x);
          float normalDir = vertexNumber < 0.5 || (vertexNumber > 1.5 && vertexNumber < 2.5) ? 1.0 : -1.0;
          float tangentDir = vertexNumber < 1.5 ? 1.0 : -1.0;
          float angle = vertexNumber < 1.5 ? v_angleStart : v_angleEnd;
          vec2 offsetPx = getOffsetDirection(normalPx * normalDir, tangentDir * tangentPx, angle) * lineWidth * 0.5;
          vec2 position =  vertexNumber < 1.5 ? a_segmentStart : a_segmentEnd;
          gl_Position = u_projectionMatrix * vec4(position, 0.0, 1.0) + pxToScreen(offsetPx);
          v_segmentStart = worldToPx(a_segmentStart);
          v_segmentEnd = worldToPx(a_segmentEnd);

          v_color = vec3(
            floor(a_color / 256.0 / 256.0) / 256.0,
            fract(floor(a_color / 256.0) / 256.0),
            fract(a_color / 256.0)
          );
        }`,
      lineStringFragmentShader: `
        precision mediump float;
        varying vec2 v_segmentStart;
        varying vec2 v_segmentEnd;
        varying float v_angleStart;
        varying float v_angleEnd;

        varying vec3 v_color;

        float segmentDistanceField(vec2 point, vec2 start, vec2 end, float radius) {
          vec2 startToPoint = point - start;
          vec2 startToEnd = end - start;
          float ratio = clamp(dot(startToPoint, startToEnd) / dot(startToEnd, startToEnd), 0.0, 1.0);
          float dist = length(startToPoint - ratio * startToEnd);
          return 1.0 - smoothstep(radius - 1.0, radius, dist);
        }

        float lineWidth = 1.5;

        void main(void) {
          gl_FragColor = vec4(v_color.rgb * 0.75, 1.0);
          gl_FragColor *= segmentDistanceField(gl_FragCoord.xy, v_segmentStart, v_segmentEnd, lineWidth);
        }`,
      pointVertexShader: `
        precision mediump float;
        uniform mat4 u_projectionMatrix;
        uniform mat4 u_offsetScaleMatrix;
        attribute vec2 a_position;
        attribute float a_index;
        varying vec2 v_texCoord;

        void main(void) {
          mat4 offsetMatrix = u_offsetScaleMatrix;
          float size = 6.0;
          float offsetX = a_index == 0.0 || a_index == 3.0 ? -size / 2.0 : size / 2.0;
          float offsetY = a_index == 0.0 || a_index == 1.0 ? -size / 2.0 : size / 2.0;
          vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);
          gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
          float u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 1.0;
          float v = a_index == 0.0 || a_index == 1.0 ? 0.0 : 1.0;
          v_texCoord = vec2(u, v);
        }`,
      pointFragmentShader: `
        precision mediump float;
        varying vec2 v_texCoord;

        void main(void) {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }`,
      attributes: [
        {
          name: 'color',
          callback: function (feature, properties) {
            const color = asArray(properties.COLOR || '#eee');
            // RGB components are encoded into one value
            return color[0] * 256 * 256 + color[1] * 256 + color[2];
          },
        },
      ],
    });
  }
}

const osm = new TileLayer({
  source: new OSM(),
});

const vectorLayer = new WebGLLayer({
  source: new VectorSource({
    url: 'https://openlayers.org/data/vector/ecoregions.json',
    format: new GeoJSON(),
  }),
});

const map = new Map({
  layers: [osm, vectorLayer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});
