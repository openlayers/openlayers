import {asArray} from '../color.js';

/**
 * Utilities for generating shaders from literal style objects
 * @module ol/webgl/ShaderBuilder
 */

/**
 * Will return the number as a float with a dot separator, which is required by GLSL.
 * @param {number} v Numerical value.
 * @returns {string} The value as string.
 */
export function formatNumber(v) {
  const s = v.toString();
  return s.indexOf('.') === -1 ? s + '.0' : s;
}

/**
 * Will normalize and converts to string a color array compatible with GLSL.
 * @param {Array<number>} colorArray Color in [r, g, b, a] array form, with RGB components in the
 * 0..255 range and the alpha component in the 0..1 range. Note that if the A component is
 * missing, only 3 values will be output.
 * @returns {string} The color components concatenated in `1.0, 1.0, 1.0, 1.0` form.
 */
export function formatColor(colorArray) {
  return colorArray.map(function (c, i) {
    return i < 3 ? c / 255 : c;
  }).map(formatNumber).join(', ');
}

/**
 * Generates a symbol vertex shader from a literal style,
 * intended to be used on point geometries.
 *
 * Expected the following attributes to be present in the attribute array:
 * `vec2 a_position`, `float a_index` (being the index of the vertex in the quad, 0 to 3).
 *
 * Transmits the following varyings to the fragment shader:
 * `vec2 v_texCoord`, `float v_opacity`, `vec4 v_color`
 *
 * @param {import('../style/LiteralStyle.js').LiteralSymbolStyle} parameters Parameters for the shader.
 * @returns {string} The full shader as a string.
 */
export function getSymbolVertexShader(parameters) {
  const offsetMatrix = parameters.rotateWithView ?
    'mat4 offsetMatrix = u_offsetScaleMatrix * u_offsetRotateMatrix;' :
    'mat4 offsetMatrix = u_offsetScaleMatrix;';

  const offset = parameters.offset || [0, 0];
  const size = Array.isArray(parameters.size) ? parameters.size : [parameters.size, parameters.size];
  const texCoord = parameters.textureCoord || [0, 0, 1, 1];
  const opacity = parameters.opacity !== undefined ? parameters.opacity : 1;
  const color = parameters.color !== undefined ?
    (typeof parameters.color === 'string' ? asArray(parameters.color) : parameters.color) :
    [255, 255, 255, 1];

  const f = formatNumber;

  const body = `precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
attribute vec2 a_position;
attribute float a_index;
varying vec2 v_texCoord;
varying float v_opacity;
varying vec4 v_color;

void main(void) {
  ${offsetMatrix}
  float offsetX = a_index == 0.0 || a_index == 3.0 ? ${f(offset[0] - size[0] / 2)} : ${f(offset[0] + size[0] / 2)};
  float offsetY = a_index == 0.0 || a_index == 1.0 ? ${f(offset[1] - size[1] / 2)} : ${f(offset[1] + size[1] / 2)};
  vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);
  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
  float u = a_index == 0.0 || a_index == 3.0 ? ${f(texCoord[0])} : ${f(texCoord[2])};
  float v = a_index == 0.0 || a_index == 1.0 ? ${f(texCoord[1])} : ${f(texCoord[3])};
  v_texCoord = vec2(u, v);
  v_opacity = ${f(opacity)};
  v_color = vec4(${formatColor(color)});
}`;

  return body;
}

/**
 * Generates a symbol fragment shader intended to be used on point geometries.
 *
 * Expected the following varyings to be transmitted by the vertex shader:
 * `vec2 v_texCoord`, `float v_opacity`, `vec4 v_color`
 *
 * @returns {string} The full shader as a string.
 */
export function getSymbolFragmentShader() {
  const body = `precision mediump float;
uniform sampler2D u_texture;
varying vec2 v_texCoord;
varying float v_opacity;
varying vec4 v_color;

void main(void) {
  if (v_opacity == 0.0) {
    discard;
  }
  vec4 textureColor = texture2D(u_texture, v_texCoord);
  gl_FragColor = v_color * textureColor;
  gl_FragColor.a *= v_opacity;
  gl_FragColor.rgb *= gl_FragColor.a;
}`;

  return body;
}
