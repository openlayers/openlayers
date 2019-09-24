import {getSymbolVertexShader, formatNumber} from '../../../../src/ol/webgl/ShaderBuilder.js';

describe('ol.webgl.ShaderBuilder', function() {

  describe('formatNumber', function() {
    it('does a simple transform when a fraction is present', function() {
      expect(formatNumber(1.3456)).to.eql('1.3456');
    });
    it('adds a fraction separator when missing', function() {
      expect(formatNumber(1)).to.eql('1.0');
      expect(formatNumber(2.0)).to.eql('2.0');
    });
  });

  describe('getSymbolVertexShader', function() {
    it('generates a symbol vertex shader without using additional attributes', function() {
      expect(getSymbolVertexShader(
        {
          rotateWithView: false,
          color: '#5000ff',
          opacity: 0.4,
          offset: [5, -7],
          size: 6,
          textureCoord: [0, 0.5, 0.5, 1]
        })).to.eql(`precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
attribute vec2 a_position;
attribute float a_index;
varying vec2 v_texCoord;
varying float v_opacity;
varying vec4 v_color;

void main(void) {
  mat4 offsetMatrix = u_offsetScaleMatrix;
  float offsetX = a_index == 0.0 || a_index == 3.0 ? 2.0 : 8.0;
  float offsetY = a_index == 0.0 || a_index == 1.0 ? -10.0 : -4.0;
  vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);
  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
  float u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 0.5;
  float v = a_index == 0.0 || a_index == 1.0 ? 0.5 : 1.0;
  v_texCoord = vec2(u, v);
  v_opacity = 0.4;
  v_color = vec4(0.3137254901960784, 0.0, 1.0, 1.0);
}`);
    });
    it('correctly handles size as an array', function() {
      expect(getSymbolVertexShader(
        {
          rotateWithView: false,
          color: '#5000ff',
          opacity: 0.4,
          offset: [5, -7],
          size: [10, 12],
          textureCoord: [0, 0.5, 0.5, 1]
        })).to.eql(`precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
attribute vec2 a_position;
attribute float a_index;
varying vec2 v_texCoord;
varying float v_opacity;
varying vec4 v_color;

void main(void) {
  mat4 offsetMatrix = u_offsetScaleMatrix;
  float offsetX = a_index == 0.0 || a_index == 3.0 ? 0.0 : 10.0;
  float offsetY = a_index == 0.0 || a_index == 1.0 ? -13.0 : -1.0;
  vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);
  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
  float u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 0.5;
  float v = a_index == 0.0 || a_index == 1.0 ? 0.5 : 1.0;
  v_texCoord = vec2(u, v);
  v_opacity = 0.4;
  v_color = vec4(0.3137254901960784, 0.0, 1.0, 1.0);
}`);
    });
    it('correctly handles rotate with view', function() {
      expect(getSymbolVertexShader(
        {
          rotateWithView: true,
          color: '#5000ff',
          opacity: 0.4,
          size: 6,
          textureCoord: [0, 0.5, 0.5, 1]
        })).to.eql(`precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
attribute vec2 a_position;
attribute float a_index;
varying vec2 v_texCoord;
varying float v_opacity;
varying vec4 v_color;

void main(void) {
  mat4 offsetMatrix = u_offsetScaleMatrix * u_offsetRotateMatrix;
  float offsetX = a_index == 0.0 || a_index == 3.0 ? -3.0 : 3.0;
  float offsetY = a_index == 0.0 || a_index == 1.0 ? -3.0 : 3.0;
  vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);
  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
  float u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 0.5;
  float v = a_index == 0.0 || a_index == 1.0 ? 0.5 : 1.0;
  v_texCoord = vec2(u, v);
  v_opacity = 0.4;
  v_color = vec4(0.3137254901960784, 0.0, 1.0, 1.0);
}`);
    });
    it('correctly handles missing optional parameters', function() {
      expect(getSymbolVertexShader(
        {
          rotateWithView: false,
          size: 5
        })).to.eql(`precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
attribute vec2 a_position;
attribute float a_index;
varying vec2 v_texCoord;
varying float v_opacity;
varying vec4 v_color;

void main(void) {
  mat4 offsetMatrix = u_offsetScaleMatrix;
  float offsetX = a_index == 0.0 || a_index == 3.0 ? -2.5 : 2.5;
  float offsetY = a_index == 0.0 || a_index == 1.0 ? -2.5 : 2.5;
  vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);
  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
  float u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 1.0;
  float v = a_index == 0.0 || a_index == 1.0 ? 0.0 : 1.0;
  v_texCoord = vec2(u, v);
  v_opacity = 1.0;
  v_color = vec4(1.0, 1.0, 1.0, 1.0);
}`);
    });
  });

});
