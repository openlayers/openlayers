import {ShaderBuilder} from '../../../../../src/ol/webgl/ShaderBuilder.js';
import {
  arrayToGlsl,
  colorToGlsl,
  numberToGlsl,
} from '../../../../../src/ol/style/expressions.js';

describe('ol.webgl.ShaderBuilder', function () {
  describe('getSymbolVertexShader', function () {
    it('generates a symbol vertex shader (with varying)', function () {
      const builder = new ShaderBuilder();
      builder.addVarying('v_opacity', 'float', numberToGlsl(0.4));
      builder.addVarying('v_test', 'vec3', arrayToGlsl([1, 2, 3]));
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolColorExpression(colorToGlsl([80, 0, 255, 1]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));

      expect(builder.getSymbolVertexShader()).to.eql(`precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
uniform float u_time;
uniform float u_zoom;
uniform float u_resolution;

attribute vec2 a_position;
attribute float a_index;

varying vec2 v_texCoord;
varying vec2 v_quadCoord;
varying float v_opacity;
varying vec3 v_test;
void main(void) {
  mat4 offsetMatrix = u_offsetScaleMatrix;
  vec2 halfSize = vec2(6.0) * 0.5;
  vec2 offset = vec2(5.0, -7.0);
  float angle = 0.0;
  float offsetX;
  float offsetY;
  if (a_index == 0.0) {
    offsetX = (offset.x - halfSize.x) * cos(angle) + (offset.y - halfSize.y) * sin(angle);
    offsetY = (offset.y - halfSize.y) * cos(angle) - (offset.x - halfSize.x) * sin(angle);
  } else if (a_index == 1.0) {
    offsetX = (offset.x + halfSize.x) * cos(angle) + (offset.y - halfSize.y) * sin(angle);
    offsetY = (offset.y - halfSize.y) * cos(angle) - (offset.x + halfSize.x) * sin(angle);
  } else if (a_index == 2.0) {
    offsetX = (offset.x + halfSize.x) * cos(angle) + (offset.y + halfSize.y) * sin(angle);
    offsetY = (offset.y + halfSize.y) * cos(angle) - (offset.x + halfSize.x) * sin(angle);
  } else {
    offsetX = (offset.x - halfSize.x) * cos(angle) + (offset.y + halfSize.y) * sin(angle);
    offsetY = (offset.y + halfSize.y) * cos(angle) - (offset.x - halfSize.x) * sin(angle);
  }
  vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);
  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
  vec4 texCoord = vec4(0.0, 0.5, 0.5, 1.0);
  float u = a_index == 0.0 || a_index == 3.0 ? texCoord.s : texCoord.p;
  float v = a_index == 2.0 || a_index == 3.0 ? texCoord.t : texCoord.q;
  v_texCoord = vec2(u, v);
  u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 1.0;
  v = a_index == 2.0 || a_index == 3.0 ? 0.0 : 1.0;
  v_quadCoord = vec2(u, v);
  v_opacity = 0.4;
  v_test = vec3(1.0, 2.0, 3.0);
}`);
    });
    it('generates a symbol vertex shader (with uniforms and attributes)', function () {
      const builder = new ShaderBuilder();
      builder.addUniform('float u_myUniform');
      builder.addAttribute('vec2 a_myAttr');
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolColorExpression(colorToGlsl([80, 0, 255, 1]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));

      expect(builder.getSymbolVertexShader()).to.eql(`precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
uniform float u_time;
uniform float u_zoom;
uniform float u_resolution;
uniform float u_myUniform;
attribute vec2 a_position;
attribute float a_index;
attribute vec2 a_myAttr;
varying vec2 v_texCoord;
varying vec2 v_quadCoord;

void main(void) {
  mat4 offsetMatrix = u_offsetScaleMatrix;
  vec2 halfSize = vec2(6.0) * 0.5;
  vec2 offset = vec2(5.0, -7.0);
  float angle = 0.0;
  float offsetX;
  float offsetY;
  if (a_index == 0.0) {
    offsetX = (offset.x - halfSize.x) * cos(angle) + (offset.y - halfSize.y) * sin(angle);
    offsetY = (offset.y - halfSize.y) * cos(angle) - (offset.x - halfSize.x) * sin(angle);
  } else if (a_index == 1.0) {
    offsetX = (offset.x + halfSize.x) * cos(angle) + (offset.y - halfSize.y) * sin(angle);
    offsetY = (offset.y - halfSize.y) * cos(angle) - (offset.x + halfSize.x) * sin(angle);
  } else if (a_index == 2.0) {
    offsetX = (offset.x + halfSize.x) * cos(angle) + (offset.y + halfSize.y) * sin(angle);
    offsetY = (offset.y + halfSize.y) * cos(angle) - (offset.x + halfSize.x) * sin(angle);
  } else {
    offsetX = (offset.x - halfSize.x) * cos(angle) + (offset.y + halfSize.y) * sin(angle);
    offsetY = (offset.y + halfSize.y) * cos(angle) - (offset.x - halfSize.x) * sin(angle);
  }
  vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);
  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
  vec4 texCoord = vec4(0.0, 0.5, 0.5, 1.0);
  float u = a_index == 0.0 || a_index == 3.0 ? texCoord.s : texCoord.p;
  float v = a_index == 2.0 || a_index == 3.0 ? texCoord.t : texCoord.q;
  v_texCoord = vec2(u, v);
  u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 1.0;
  v = a_index == 2.0 || a_index == 3.0 ? 0.0 : 1.0;
  v_quadCoord = vec2(u, v);

}`);
    });
    it('generates a symbol vertex shader (with rotateWithView)', function () {
      const builder = new ShaderBuilder();
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolColorExpression(colorToGlsl([80, 0, 255, 1]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));
      builder.setSymbolRotateWithView(true);

      expect(builder.getSymbolVertexShader()).to.eql(`precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
uniform float u_time;
uniform float u_zoom;
uniform float u_resolution;

attribute vec2 a_position;
attribute float a_index;

varying vec2 v_texCoord;
varying vec2 v_quadCoord;

void main(void) {
  mat4 offsetMatrix = u_offsetScaleMatrix * u_offsetRotateMatrix;
  vec2 halfSize = vec2(6.0) * 0.5;
  vec2 offset = vec2(5.0, -7.0);
  float angle = 0.0;
  float offsetX;
  float offsetY;
  if (a_index == 0.0) {
    offsetX = (offset.x - halfSize.x) * cos(angle) + (offset.y - halfSize.y) * sin(angle);
    offsetY = (offset.y - halfSize.y) * cos(angle) - (offset.x - halfSize.x) * sin(angle);
  } else if (a_index == 1.0) {
    offsetX = (offset.x + halfSize.x) * cos(angle) + (offset.y - halfSize.y) * sin(angle);
    offsetY = (offset.y - halfSize.y) * cos(angle) - (offset.x + halfSize.x) * sin(angle);
  } else if (a_index == 2.0) {
    offsetX = (offset.x + halfSize.x) * cos(angle) + (offset.y + halfSize.y) * sin(angle);
    offsetY = (offset.y + halfSize.y) * cos(angle) - (offset.x + halfSize.x) * sin(angle);
  } else {
    offsetX = (offset.x - halfSize.x) * cos(angle) + (offset.y + halfSize.y) * sin(angle);
    offsetY = (offset.y + halfSize.y) * cos(angle) - (offset.x - halfSize.x) * sin(angle);
  }
  vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);
  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
  vec4 texCoord = vec4(0.0, 0.5, 0.5, 1.0);
  float u = a_index == 0.0 || a_index == 3.0 ? texCoord.s : texCoord.p;
  float v = a_index == 2.0 || a_index == 3.0 ? texCoord.t : texCoord.q;
  v_texCoord = vec2(u, v);
  u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 1.0;
  v = a_index == 2.0 || a_index == 3.0 ? 0.0 : 1.0;
  v_quadCoord = vec2(u, v);

}`);
    });
    it('generates a symbol vertex shader for hitDetection', function () {
      const builder = new ShaderBuilder();

      expect(builder.getSymbolVertexShader(true)).to
        .eql(`precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
uniform float u_time;
uniform float u_zoom;
uniform float u_resolution;

attribute vec2 a_position;
attribute float a_index;
attribute vec4 a_hitColor;
varying vec2 v_texCoord;
varying vec2 v_quadCoord;
varying vec4 v_hitColor;
void main(void) {
  mat4 offsetMatrix = u_offsetScaleMatrix;
  vec2 halfSize = vec2(1.0) * 0.5;
  vec2 offset = vec2(0.0);
  float angle = 0.0;
  float offsetX;
  float offsetY;
  if (a_index == 0.0) {
    offsetX = (offset.x - halfSize.x) * cos(angle) + (offset.y - halfSize.y) * sin(angle);
    offsetY = (offset.y - halfSize.y) * cos(angle) - (offset.x - halfSize.x) * sin(angle);
  } else if (a_index == 1.0) {
    offsetX = (offset.x + halfSize.x) * cos(angle) + (offset.y - halfSize.y) * sin(angle);
    offsetY = (offset.y - halfSize.y) * cos(angle) - (offset.x + halfSize.x) * sin(angle);
  } else if (a_index == 2.0) {
    offsetX = (offset.x + halfSize.x) * cos(angle) + (offset.y + halfSize.y) * sin(angle);
    offsetY = (offset.y + halfSize.y) * cos(angle) - (offset.x + halfSize.x) * sin(angle);
  } else {
    offsetX = (offset.x - halfSize.x) * cos(angle) + (offset.y + halfSize.y) * sin(angle);
    offsetY = (offset.y + halfSize.y) * cos(angle) - (offset.x - halfSize.x) * sin(angle);
  }
  vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);
  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
  vec4 texCoord = vec4(0.0, 0.0, 1.0, 1.0);
  float u = a_index == 0.0 || a_index == 3.0 ? texCoord.s : texCoord.p;
  float v = a_index == 2.0 || a_index == 3.0 ? texCoord.t : texCoord.q;
  v_texCoord = vec2(u, v);
  u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 1.0;
  v = a_index == 2.0 || a_index == 3.0 ? 0.0 : 1.0;
  v_quadCoord = vec2(u, v);
  v_hitColor = a_hitColor;
}`);
    });
    it('generates a symbol vertex shader (with a rotation expression)', function () {
      const builder = new ShaderBuilder();
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolRotationExpression('u_time * 0.2');

      expect(builder.getSymbolVertexShader()).to.eql(`precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
uniform float u_time;
uniform float u_zoom;
uniform float u_resolution;

attribute vec2 a_position;
attribute float a_index;

varying vec2 v_texCoord;
varying vec2 v_quadCoord;

void main(void) {
  mat4 offsetMatrix = u_offsetScaleMatrix;
  vec2 halfSize = vec2(6.0) * 0.5;
  vec2 offset = vec2(5.0, -7.0);
  float angle = u_time * 0.2;
  float offsetX;
  float offsetY;
  if (a_index == 0.0) {
    offsetX = (offset.x - halfSize.x) * cos(angle) + (offset.y - halfSize.y) * sin(angle);
    offsetY = (offset.y - halfSize.y) * cos(angle) - (offset.x - halfSize.x) * sin(angle);
  } else if (a_index == 1.0) {
    offsetX = (offset.x + halfSize.x) * cos(angle) + (offset.y - halfSize.y) * sin(angle);
    offsetY = (offset.y - halfSize.y) * cos(angle) - (offset.x + halfSize.x) * sin(angle);
  } else if (a_index == 2.0) {
    offsetX = (offset.x + halfSize.x) * cos(angle) + (offset.y + halfSize.y) * sin(angle);
    offsetY = (offset.y + halfSize.y) * cos(angle) - (offset.x + halfSize.x) * sin(angle);
  } else {
    offsetX = (offset.x - halfSize.x) * cos(angle) + (offset.y + halfSize.y) * sin(angle);
    offsetY = (offset.y + halfSize.y) * cos(angle) - (offset.x - halfSize.x) * sin(angle);
  }
  vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);
  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
  vec4 texCoord = vec4(0.0, 0.0, 1.0, 1.0);
  float u = a_index == 0.0 || a_index == 3.0 ? texCoord.s : texCoord.p;
  float v = a_index == 2.0 || a_index == 3.0 ? texCoord.t : texCoord.q;
  v_texCoord = vec2(u, v);
  u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 1.0;
  v = a_index == 2.0 || a_index == 3.0 ? 0.0 : 1.0;
  v_quadCoord = vec2(u, v);

}`);
    });
  });
  describe('getSymbolFragmentShader', function () {
    it('generates a symbol fragment shader (with varying)', function () {
      const builder = new ShaderBuilder();
      builder.addVarying('v_opacity', 'float', numberToGlsl(0.4));
      builder.addVarying('v_test', 'vec3', arrayToGlsl([1, 2, 3]));
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolColorExpression(colorToGlsl([80, 0, 255]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));

      expect(builder.getSymbolFragmentShader()).to.eql(`precision mediump float;
uniform float u_time;
uniform float u_zoom;
uniform float u_resolution;

varying vec2 v_texCoord;
varying vec2 v_quadCoord;
varying float v_opacity;
varying vec3 v_test;
void main(void) {
  if (false) { discard; }
  gl_FragColor = vec4(0.3137254901960784, 0.0, 1.0, 1.0);
  gl_FragColor.rgb *= gl_FragColor.a;

}`);
    });
    it('generates a symbol fragment shader (with uniforms)', function () {
      const builder = new ShaderBuilder();
      builder.addUniform('float u_myUniform');
      builder.addUniform('vec2 u_myUniform2');
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolColorExpression(colorToGlsl([255, 255, 255, 1]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));
      builder.setFragmentDiscardExpression('u_myUniform > 0.5');

      expect(builder.getSymbolFragmentShader()).to.eql(`precision mediump float;
uniform float u_time;
uniform float u_zoom;
uniform float u_resolution;
uniform float u_myUniform;
uniform vec2 u_myUniform2;
varying vec2 v_texCoord;
varying vec2 v_quadCoord;

void main(void) {
  if (u_myUniform > 0.5) { discard; }
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  gl_FragColor.rgb *= gl_FragColor.a;

}`);
    });
    it('generates a symbol fragment shader for hit detection', function () {
      const builder = new ShaderBuilder();

      expect(builder.getSymbolFragmentShader(true)).to
        .eql(`precision mediump float;
uniform float u_time;
uniform float u_zoom;
uniform float u_resolution;

varying vec2 v_texCoord;
varying vec2 v_quadCoord;
varying vec4 v_hitColor;
void main(void) {
  if (false) { discard; }
  gl_FragColor = vec4(1.0);
  gl_FragColor.rgb *= gl_FragColor.a;
  if (gl_FragColor.a < 0.1) { discard; } gl_FragColor = v_hitColor;
}`);
    });
  });
});
