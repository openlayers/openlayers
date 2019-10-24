import {parseLiteralStyle, ShaderBuilder} from '../../../../src/ol/webgl/ShaderBuilder.js';
import {arrayToGlsl, colorToGlsl, numberToGlsl} from '../../../../src/ol/style/expressions.js';

describe('ol.webgl.ShaderBuilder', function() {

  describe('getSymbolVertexShader', function() {
    it('generates a symbol vertex shader (with varying)', function() {
      const builder = new ShaderBuilder();
      builder.addVarying('v_opacity', 'float', numberToGlsl(0.4));
      builder.addVarying('v_test', 'vec3', arrayToGlsl([1, 2, 3]));
      builder.setSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setColorExpression(colorToGlsl([80, 0, 255, 1]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));

      expect(builder.getSymbolVertexShader()).to.eql(`precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
uniform float u_time;

attribute vec2 a_position;
attribute float a_index;

varying vec2 v_texCoord;
varying vec2 v_quadCoord;
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
  u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 1.0;
  v = a_index == 2.0 || a_index == 3.0 ? 0.0 : 1.0;
  v_quadCoord = vec2(u, v);
  v_opacity = 0.4;
  v_test = vec3(1.0, 2.0, 3.0);
}`);
    });
    it('generates a symbol vertex shader (with uniforms and attributes)', function() {
      const builder = new ShaderBuilder();
      builder.addUniform('float u_myUniform');
      builder.addAttribute('vec2 a_myAttr');
      builder.setSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setColorExpression(colorToGlsl([80, 0, 255, 1]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));

      expect(builder.getSymbolVertexShader()).to.eql(`precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
uniform float u_time;
uniform float u_myUniform;
attribute vec2 a_position;
attribute float a_index;
attribute vec2 a_myAttr;
varying vec2 v_texCoord;
varying vec2 v_quadCoord;

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
  u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 1.0;
  v = a_index == 2.0 || a_index == 3.0 ? 0.0 : 1.0;
  v_quadCoord = vec2(u, v);

}`);
    });
    it('generates a symbol vertex shader (with rotateWithView)', function() {
      const builder = new ShaderBuilder();
      builder.setSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setColorExpression(colorToGlsl([80, 0, 255, 1]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));
      builder.setSymbolRotateWithView(true);

      expect(builder.getSymbolVertexShader()).to.eql(`precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
uniform float u_time;

attribute vec2 a_position;
attribute float a_index;

varying vec2 v_texCoord;
varying vec2 v_quadCoord;

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
  u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 1.0;
  v = a_index == 2.0 || a_index == 3.0 ? 0.0 : 1.0;
  v_quadCoord = vec2(u, v);

}`);
    });
  });

  describe('getSymbolFragmentShader', function() {
    it('generates a symbol fragment shader (with varying)', function() {
      const builder = new ShaderBuilder();
      builder.addVarying('v_opacity', 'float', numberToGlsl(0.4));
      builder.addVarying('v_test', 'vec3', arrayToGlsl([1, 2, 3]));
      builder.setSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setColorExpression(colorToGlsl([80, 0, 255]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));

      expect(builder.getSymbolFragmentShader()).to.eql(`precision mediump float;
uniform float u_time;

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
    it('generates a symbol fragment shader (with uniforms)', function() {
      const builder = new ShaderBuilder();
      builder.addUniform('float u_myUniform');
      builder.addUniform('vec2 u_myUniform2');
      builder.setSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setColorExpression(colorToGlsl([255, 255, 255, 1]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));
      builder.setFragmentDiscardExpression('u_myUniform > 0.5');

      expect(builder.getSymbolFragmentShader()).to.eql(`precision mediump float;
uniform float u_time;
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
  });

  describe('parseSymbolStyle', function() {
    it('parses a style without expressions', function() {
      const result = parseLiteralStyle({
        symbol: {
          symbolType: 'square',
          size: [4, 8],
          color: '#ff0000',
          rotateWithView: true
        }
      });

      expect(result.builder.uniforms).to.eql([]);
      expect(result.builder.attributes).to.eql([]);
      expect(result.builder.varyings).to.eql([]);
      expect(result.builder.colorExpression).to.eql(
        'vec4(vec4(1.0, 0.0, 0.0, 1.0).rgb, vec4(1.0, 0.0, 0.0, 1.0).a * 1.0 * 1.0)');
      expect(result.builder.sizeExpression).to.eql('vec2(4.0, 8.0)');
      expect(result.builder.offsetExpression).to.eql('vec2(0.0, 0.0)');
      expect(result.builder.texCoordExpression).to.eql('vec4(0.0, 0.0, 1.0, 1.0)');
      expect(result.builder.rotateWithView).to.eql(true);
      expect(result.attributes).to.eql([]);
      expect(result.uniforms).to.eql({});
    });

    it('parses a style with expressions', function() {
      const result = parseLiteralStyle({
        symbol: {
          symbolType: 'square',
          size: ['get', 'attr1'],
          color: [255, 127.5, 63.75, 0.25],
          textureCoord: [0.5, 0.5, 0.5, 1],
          offset: [3, ['get', 'attr3']]
        }
      });

      expect(result.builder.uniforms).to.eql([]);
      expect(result.builder.attributes).to.eql(['float a_attr1', 'float a_attr3']);
      expect(result.builder.varyings).to.eql([{
        name: 'v_attr1',
        type: 'float',
        expression: 'a_attr1'
      }]);
      expect(result.builder.colorExpression).to.eql(
        'vec4(vec4(1.0, 0.5, 0.25, 0.25).rgb, vec4(1.0, 0.5, 0.25, 0.25).a * 1.0 * 1.0)'
      );
      expect(result.builder.sizeExpression).to.eql('vec2(a_attr1, a_attr1)');
      expect(result.builder.offsetExpression).to.eql('vec2(3.0, a_attr3)');
      expect(result.builder.texCoordExpression).to.eql('vec4(0.5, 0.5, 0.5, 1.0)');
      expect(result.builder.rotateWithView).to.eql(false);
      expect(result.attributes.length).to.eql(2);
      expect(result.attributes[0].name).to.eql('attr1');
      expect(result.attributes[1].name).to.eql('attr3');
      expect(result.uniforms).to.eql({});
    });

    it('parses a style with a uniform (texture)', function() {
      const result = parseLiteralStyle({
        symbol: {
          symbolType: 'image',
          src: '../data/image.png',
          size: 6,
          color: '#336699',
          opacity: 0.5
        }
      });

      expect(result.builder.uniforms).to.eql(['sampler2D u_texture']);
      expect(result.builder.attributes).to.eql([]);
      expect(result.builder.varyings).to.eql([]);
      expect(result.builder.colorExpression).to.eql(
        'vec4(vec4(0.2, 0.4, 0.6, 1.0).rgb, vec4(0.2, 0.4, 0.6, 1.0).a * 0.5 * 1.0) * texture2D(u_texture, v_texCoord)'
      );
      expect(result.builder.sizeExpression).to.eql('vec2(6.0, 6.0)');
      expect(result.builder.offsetExpression).to.eql('vec2(0.0, 0.0)');
      expect(result.builder.texCoordExpression).to.eql('vec4(0.0, 0.0, 1.0, 1.0)');
      expect(result.builder.rotateWithView).to.eql(false);
      expect(result.attributes).to.eql([]);
      expect(result.uniforms).to.have.property('u_texture');
    });

    it('parses a style with variables', function() {
      const result = parseLiteralStyle({
        variables: {
          lower: 100,
          higher: 400
        },
        symbol: {
          symbolType: 'square',
          size: ['stretch', ['get', 'population'], ['var', 'lower'], ['var', 'higher'], 4, 8],
          color: '#336699',
          opacity: 0.5
        }
      });

      expect(result.builder.uniforms).to.eql(['float u_lower', 'float u_higher']);
      expect(result.builder.attributes).to.eql(['float a_population']);
      expect(result.builder.varyings).to.eql([{
        name: 'v_population',
        type: 'float',
        expression: 'a_population'
      }]);
      expect(result.builder.colorExpression).to.eql(
        'vec4(vec4(0.2, 0.4, 0.6, 1.0).rgb, vec4(0.2, 0.4, 0.6, 1.0).a * 0.5 * 1.0)'
      );
      expect(result.builder.sizeExpression).to.eql(
        'vec2(((clamp(a_population, u_lower, u_higher) - u_lower) * ((8.0 - 4.0) / (u_higher - u_lower)) + 4.0), ((clamp(a_population, u_lower, u_higher) - u_lower) * ((8.0 - 4.0) / (u_higher - u_lower)) + 4.0))'
      );
      expect(result.builder.offsetExpression).to.eql('vec2(0.0, 0.0)');
      expect(result.builder.texCoordExpression).to.eql('vec4(0.0, 0.0, 1.0, 1.0)');
      expect(result.builder.rotateWithView).to.eql(false);
      expect(result.attributes.length).to.eql(1);
      expect(result.attributes[0].name).to.eql('population');
      expect(result.uniforms).to.have.property('u_lower');
      expect(result.uniforms).to.have.property('u_higher');
    });

    it('parses a style with a filter', function() {
      const result = parseLiteralStyle({
        filter: ['between', ['get', 'attr0'], 0, 10],
        symbol: {
          symbolType: 'square',
          size: 6,
          color: '#336699'
        }
      });

      expect(result.builder.attributes).to.eql(['float a_attr0']);
      expect(result.builder.varyings).to.eql([{
        name: 'v_attr0',
        type: 'float',
        expression: 'a_attr0'
      }]);
      expect(result.builder.colorExpression).to.eql(
        'vec4(vec4(0.2, 0.4, 0.6, 1.0).rgb, vec4(0.2, 0.4, 0.6, 1.0).a * 1.0 * 1.0)'
      );
      expect(result.builder.sizeExpression).to.eql('vec2(6.0, 6.0)');
      expect(result.builder.offsetExpression).to.eql('vec2(0.0, 0.0)');
      expect(result.builder.texCoordExpression).to.eql('vec4(0.0, 0.0, 1.0, 1.0)');
      expect(result.builder.discardExpression).to.eql('(v_attr0 >= 0.0 && v_attr0 <= 10.0)');
      expect(result.builder.rotateWithView).to.eql(false);
      expect(result.attributes.length).to.eql(1);
      expect(result.attributes[0].name).to.eql('attr0');
    });

    it('parses a style with a color interpolation', function() {
      const result = parseLiteralStyle({
        symbol: {
          symbolType: 'square',
          size: 6,
          color: ['interpolate', ['var', 'ratio'], [255, 255, 0], 'red']
        }
      });

      expect(result.builder.attributes).to.eql([]);
      expect(result.builder.varyings).to.eql([]);
      expect(result.builder.colorExpression).to.eql(
        'vec4(mix(vec4(1.0, 1.0, 0.0, 1.0), vec4(1.0, 0.0, 0.0, 1.0), u_ratio).rgb, mix(vec4(1.0, 1.0, 0.0, 1.0), vec4(1.0, 0.0, 0.0, 1.0), u_ratio).a * 1.0 * 1.0)'
      );
      expect(result.builder.sizeExpression).to.eql('vec2(6.0, 6.0)');
      expect(result.builder.offsetExpression).to.eql('vec2(0.0, 0.0)');
      expect(result.builder.texCoordExpression).to.eql('vec4(0.0, 0.0, 1.0, 1.0)');
      expect(result.builder.rotateWithView).to.eql(false);
      expect(result.attributes).to.eql([]);
      expect(result.uniforms).to.have.property('u_ratio');
    });
  });

});
