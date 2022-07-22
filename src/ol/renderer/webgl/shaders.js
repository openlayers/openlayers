/**
 * @module ol/renderer/webgl/shaders
 */
import {asArray} from '../../color.js';

/** @typedef {'color'|'opacity'|'width'} DefaultAttributes */

/**
 * Packs red/green/blue channels of a color into a single float value; alpha is ignored.
 * This is how the color is expected to be computed.
 * @param {import("../../color.js").Color|string} color Color as array of numbers or string
 * @return {number} Float value containing the color
 */
export function packColor(color) {
  const array = asArray(color);
  const r = array[0] * 256 * 256;
  const g = array[1] * 256;
  const b = array[2];
  return r + g + b;
}

const DECODE_COLOR_EXPRESSION = `vec3(
  fract(floor(a_color / 256.0 / 256.0) / 256.0),
  fract(floor(a_color / 256.0) / 256.0),
  fract(a_color / 256.0)
);`;

/**
 * Default polygon vertex shader.
 * Relies on the color and opacity attributes.
 * @type {string}
 */
export const FILL_VERTEX_SHADER = `
  precision mediump float;
  uniform mat4 u_projectionMatrix;
  attribute vec2 a_position;
  attribute float a_color;
  attribute float a_opacity;
  varying vec3 v_color;
  varying float v_opacity;

  void main(void) {
    gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0);
    v_color = ${DECODE_COLOR_EXPRESSION}
    v_opacity = a_opacity;
  }`;

/**
 * Default polygon fragment shader.
 * @type {string}
 */
export const FILL_FRAGMENT_SHADER = `
  precision mediump float;
  varying vec3 v_color;
  varying float v_opacity;

  void main(void) {
    gl_FragColor = vec4(v_color, 1.0) * v_opacity;
  }`;

/**
 * Default linestring vertex shader.
 * Relies on color, opacity and width attributes.
 * @type {string}
 */
export const STROKE_VERTEX_SHADER = `
  precision mediump float;
  uniform mat4 u_projectionMatrix;
  uniform vec2 u_sizePx;
  attribute vec2 a_segmentStart;
  attribute vec2 a_segmentEnd;
  attribute float a_parameters;
  attribute float a_color;
  attribute float a_opacity;
  attribute float a_width;
  varying vec2 v_segmentStart;
  varying vec2 v_segmentEnd;
  varying float v_angleStart;
  varying float v_angleEnd;
  varying vec3 v_color;
  varying float v_opacity;
  varying float v_width;

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
    vec2 offsetPx = getOffsetDirection(normalPx * normalDir, tangentDir * tangentPx, angle) * a_width * 0.5;
    vec2 position =  vertexNumber < 1.5 ? a_segmentStart : a_segmentEnd;
    gl_Position = u_projectionMatrix * vec4(position, 0.0, 1.0) + pxToScreen(offsetPx);
    v_segmentStart = worldToPx(a_segmentStart);
    v_segmentEnd = worldToPx(a_segmentEnd);
    v_color = ${DECODE_COLOR_EXPRESSION}
    v_opacity = a_opacity;
    v_width = a_width;
  }`;

/**
 * Default linestring fragment shader.
 * @type {string}
 */
export const STROKE_FRAGMENT_SHADER = `
  precision mediump float;
  uniform float u_pixelRatio;
  varying vec2 v_segmentStart;
  varying vec2 v_segmentEnd;
  varying float v_angleStart;
  varying float v_angleEnd;
  varying vec3 v_color;
  varying float v_opacity;
  varying float v_width;

  float segmentDistanceField(vec2 point, vec2 start, vec2 end, float radius) {
    vec2 startToPoint = point - start;
    vec2 startToEnd = end - start;
    float ratio = clamp(dot(startToPoint, startToEnd) / dot(startToEnd, startToEnd), 0.0, 1.0);
    float dist = length(startToPoint - ratio * startToEnd);
    return 1.0 - smoothstep(radius - 1.0, radius, dist);
  }

  void main(void) {
    vec2 v_currentPoint = gl_FragCoord.xy / u_pixelRatio;
    gl_FragColor = vec4(v_color, 1.0) * v_opacity;
    gl_FragColor *= segmentDistanceField(v_currentPoint, v_segmentStart, v_segmentEnd, v_width);
  }`;

/**
 * Default point vertex shader.
 * Relies on color and opacity attributes.
 * @type {string}
 */
export const POINT_VERTEX_SHADER = `
  precision mediump float;
  uniform mat4 u_projectionMatrix;
  uniform mat4 u_offsetScaleMatrix;
  attribute vec2 a_position;
  attribute float a_index;
  attribute float a_color;
  attribute float a_opacity;
  varying vec2 v_texCoord;
  varying vec3 v_color;
  varying float v_opacity;

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
    v_color = ${DECODE_COLOR_EXPRESSION}
    v_opacity = a_opacity;
  }`;

/**
 * Default point fragment shader.
 * @type {string}
 */
export const POINT_FRAGMENT_SHADER = `
  precision mediump float;
  varying vec3 v_color;
  varying float v_opacity;

  void main(void) {
      gl_FragColor = vec4(v_color, 1.0) * v_opacity;
  }`;
