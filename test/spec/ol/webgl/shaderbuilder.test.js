import {
  getSymbolVertexShader,
  formatNumber,
  getSymbolFragmentShader,
  formatColor, formatArray
} from '../../../../src/ol/webgl/ShaderBuilder.js';

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

  describe('formatArray', function() {
    it('outputs numbers with dot separators', function() {
      expect(formatArray([1, 0, 3.45, 0.8888])).to.eql('1.0, 0.0, 3.45, 0.8888');
    });
  });

  describe('formatColor', function() {
    it('normalizes color and outputs numbers with dot separators', function() {
      expect(formatColor([100, 0, 255, 1])).to.eql('0.39215686274509803, 0.0, 1.0, 1.0');
    });
  });

  describe('getSymbolVertexShader', function() {
    it('generates a symbol vertex shader (with varying)', function() {
      const parameters = {
        varyings: [{
          name: 'v_opacity',
          type: 'float',
          expression: formatNumber(0.4)
        }, {
          name: 'v_test',
          type: 'vec3',
          expression: 'vec3(' + formatArray([1, 2, 3]) + ')'
        }],
        sizeExpression: 'vec2(' + formatNumber(6) + ')',
        offsetExpression: 'vec2(' + formatArray([5, -7]) + ')',
        colorExpression: 'vec4(' + formatColor([80, 0, 255, 1]) + ')',
        texCoordExpression: 'vec4(' + formatArray([0, 0.5, 0.5, 1]) + ')',
        rotateWithView: false
      };

      expect(getSymbolVertexShader(parameters)).to.eql(`precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;

attribute vec2 a_position;
attribute float a_index;

varying vec2 v_texCoord;
varying float v_opacity;
varying vec3 v_test;
void main(void) {
  mat4 offsetMatrix = u_offsetScaleMatrix;
  vec2 size = vec2(6.0);
  vec2 offset = vec2(5.0, -7.0);
  float offsetX = a_index == 0.0 || a_index == 3.0 ? offset.x - size.x / 2.0 : offset.x + size.x / 2.0;
  float offsetY = a_index == 0.0 || a_index == 1.0 ? offset.y - size.y / 2.0 : offset.y + size.y / 2.0;
  vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);
  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
  vec4 texCoord = vec4(0.0, 0.5, 0.5, 1.0);
  float u = a_index == 0.0 || a_index == 3.0 ? texCoord.s : texCoord.q;
  float v = a_index == 2.0 || a_index == 3.0 ? texCoord.t : texCoord.p;
  v_texCoord = vec2(u, v);
  v_opacity = 0.4;
  v_test = vec3(1.0, 2.0, 3.0);
}`);
    });
    it('generates a symbol vertex shader (with uniforms and attributes)', function() {
      const parameters = {
        uniforms: ['float u_myUniform'],
        attributes: ['vec2 a_myAttr'],
        sizeExpression: 'vec2(' + formatNumber(6) + ')',
        offsetExpression: 'vec2(' + formatArray([5, -7]) + ')',
        colorExpression: 'vec4(' + formatColor([80, 0, 255, 1]) + ')',
        texCoordExpression: 'vec4(' + formatArray([0, 0.5, 0.5, 1]) + ')'
      };

      expect(getSymbolVertexShader(parameters)).to.eql(`precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
uniform float u_myUniform;
attribute vec2 a_position;
attribute float a_index;
attribute vec2 a_myAttr;
varying vec2 v_texCoord;

void main(void) {
  mat4 offsetMatrix = u_offsetScaleMatrix;
  vec2 size = vec2(6.0);
  vec2 offset = vec2(5.0, -7.0);
  float offsetX = a_index == 0.0 || a_index == 3.0 ? offset.x - size.x / 2.0 : offset.x + size.x / 2.0;
  float offsetY = a_index == 0.0 || a_index == 1.0 ? offset.y - size.y / 2.0 : offset.y + size.y / 2.0;
  vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);
  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
  vec4 texCoord = vec4(0.0, 0.5, 0.5, 1.0);
  float u = a_index == 0.0 || a_index == 3.0 ? texCoord.s : texCoord.q;
  float v = a_index == 2.0 || a_index == 3.0 ? texCoord.t : texCoord.p;
  v_texCoord = vec2(u, v);

}`);
    });
    it('generates a symbol vertex shader (with rotateWithView)', function() {
      const parameters = {
        sizeExpression: 'vec2(' + formatNumber(6) + ')',
        offsetExpression: 'vec2(' + formatArray([5, -7]) + ')',
        colorExpression: 'vec4(' + formatColor([80, 0, 255, 1]) + ')',
        texCoordExpression: 'vec4(' + formatArray([0, 0.5, 0.5, 1]) + ')',
        rotateWithView: true
      };

      expect(getSymbolVertexShader(parameters)).to.eql(`precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;

attribute vec2 a_position;
attribute float a_index;

varying vec2 v_texCoord;

void main(void) {
  mat4 offsetMatrix = u_offsetScaleMatrix * u_offsetRotateMatrix;
  vec2 size = vec2(6.0);
  vec2 offset = vec2(5.0, -7.0);
  float offsetX = a_index == 0.0 || a_index == 3.0 ? offset.x - size.x / 2.0 : offset.x + size.x / 2.0;
  float offsetY = a_index == 0.0 || a_index == 1.0 ? offset.y - size.y / 2.0 : offset.y + size.y / 2.0;
  vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);
  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
  vec4 texCoord = vec4(0.0, 0.5, 0.5, 1.0);
  float u = a_index == 0.0 || a_index == 3.0 ? texCoord.s : texCoord.q;
  float v = a_index == 2.0 || a_index == 3.0 ? texCoord.t : texCoord.p;
  v_texCoord = vec2(u, v);

}`);
    });
  });

  describe('getSymbolFragmentShader', function() {
    it('generates a symbol fragment shader (with varying)', function() {
      const parameters = {
        varyings: [{
          name: 'v_opacity',
          type: 'float',
          expression: formatNumber(0.4)
        }, {
          name: 'v_test',
          type: 'vec3',
          expression: 'vec3(' + formatArray([1, 2, 3]) + ')'
        }],
        sizeExpression: 'vec2(' + formatNumber(6) + ')',
        offsetExpression: 'vec2(' + formatArray([5, -7]) + ')',
        colorExpression: 'vec4(' + formatColor([80, 0, 255]) + ', v_opacity)',
        texCoordExpression: 'vec4(' + formatArray([0, 0.5, 0.5, 1]) + ')',
        rotateWithView: false
      };

      expect(getSymbolFragmentShader(parameters)).to.eql(`precision mediump float;

varying vec2 v_texCoord;
varying float v_opacity;
varying vec3 v_test;
void main(void) {
  gl_FragColor = vec4(0.3137254901960784, 0.0, 1.0, v_opacity);
  gl_FragColor.rgb *= gl_FragColor.a;
}`);
    });
    it('generates a symbol fragment shader (with uniforms)', function() {
      const parameters = {
        uniforms: ['float u_myUniform', 'vec2 u_myUniform2'],
        sizeExpression: 'vec2(' + formatNumber(6) + ')',
        offsetExpression: 'vec2(' + formatArray([5, -7]) + ')',
        colorExpression: 'vec4(' + formatColor([255, 255, 255, 1]) + ')',
        texCoordExpression: 'vec4(' + formatArray([0, 0.5, 0.5, 1]) + ')'
      };

      expect(getSymbolFragmentShader(parameters)).to.eql(`precision mediump float;
uniform float u_myUniform;
uniform vec2 u_myUniform2;
varying vec2 v_texCoord;

void main(void) {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  gl_FragColor.rgb *= gl_FragColor.a;
}`);
    });
  });

});
