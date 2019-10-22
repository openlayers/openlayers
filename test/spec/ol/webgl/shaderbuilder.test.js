import {
  check,
  formatArray,
  formatColor,
  formatNumber,
  isValueTypeColor,
  isValueTypeNumber,
  isValueTypeString,
  parse,
  parseLiteralStyle,
  ShaderBuilder,
  ValueTypes
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
      expect(formatArray([1, 0, 3.45, 0.8888])).to.eql('vec4(1.0, 0.0, 3.45, 0.8888)');
      expect(formatArray([3, 4])).to.eql('vec2(3.0, 4.0)');
    });
    it('throws on invalid lengths', function() {
      let thrown = false;
      try {
        formatArray([3]);
      } catch (e) {
        thrown = true;
      }
      try {
        formatArray([3, 2, 1, 0, -1]);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(true);
    });
  });

  describe('formatColor', function() {
    it('normalizes color and outputs numbers with dot separators', function() {
      expect(formatColor([100, 0, 255])).to.eql('vec4(0.39215686274509803, 0.0, 1.0, 1.0)');
      expect(formatColor([100, 0, 255, 1])).to.eql('vec4(0.39215686274509803, 0.0, 1.0, 1.0)');
    });
    it('handles colors in string format', function() {
      expect(formatColor('red')).to.eql('vec4(1.0, 0.0, 0.0, 1.0)');
      expect(formatColor('#00ff99')).to.eql('vec4(0.0, 1.0, 0.6, 1.0)');
      expect(formatColor('rgb(100, 0, 255)')).to.eql('vec4(0.39215686274509803, 0.0, 1.0, 1.0)');
      expect(formatColor('rgba(100, 0, 255, 0.3)')).to.eql('vec4(0.39215686274509803, 0.0, 1.0, 0.3)');
    });
  });

  describe('value type checking', function() {
    it('correctly recognizes a number value', function() {
      expect(isValueTypeNumber(1234)).to.eql(true);
      expect(isValueTypeNumber(['time'])).to.eql(true);
      expect(isValueTypeNumber(['clamp', ['get', 'attr'], -1, 1])).to.eql(true);
      expect(isValueTypeNumber(['interpolate', ['get', 'attr'], 'red', 'green'])).to.eql(false);
      expect(isValueTypeNumber('yellow')).to.eql(false);
      expect(isValueTypeNumber('#113366')).to.eql(false);
      expect(isValueTypeNumber('rgba(252,171,48,0.62)')).to.eql(false);
    });
    it('correctly recognizes a color value', function() {
      expect(isValueTypeColor(1234)).to.eql(false);
      expect(isValueTypeColor(['time'])).to.eql(false);
      expect(isValueTypeColor(['clamp', ['get', 'attr'], -1, 1])).to.eql(false);
      expect(isValueTypeColor(['interpolate', ['get', 'attr'], 'red', 'green'])).to.eql(true);
      expect(isValueTypeColor('yellow')).to.eql(true);
      expect(isValueTypeColor('#113366')).to.eql(true);
      expect(isValueTypeColor('rgba(252,171,48,0.62)')).to.eql(true);
      expect(isValueTypeColor('abcd')).to.eql(false);
    });
    it('correctly recognizes a string value', function() {
      expect(isValueTypeString(1234)).to.eql(false);
      expect(isValueTypeString(['time'])).to.eql(false);
      expect(isValueTypeString(['clamp', ['get', 'attr'], -1, 1])).to.eql(false);
      expect(isValueTypeString(['interpolate', ['get', 'attr'], 'red', 'green'])).to.eql(false);
      expect(isValueTypeString('yellow')).to.eql(true);
      expect(isValueTypeString('#113366')).to.eql(true);
      expect(isValueTypeString('rgba(252,171,48,0.62)')).to.eql(true);
      expect(isValueTypeString('abcd')).to.eql(true);
    });
    it('throws on an unsupported type', function(done) {
      try {
        isValueTypeColor(true);
      } catch (e) {
        done();
      }
      done(true);
    });
  });

  describe('getSymbolVertexShader', function() {
    it('generates a symbol vertex shader (with varying)', function() {
      const builder = new ShaderBuilder();
      builder.addVarying('v_opacity', 'float', formatNumber(0.4));
      builder.addVarying('v_test', 'vec3', formatArray([1, 2, 3]));
      builder.setSizeExpression(`vec2(${formatNumber(6)})`);
      builder.setSymbolOffsetExpression(formatArray([5, -7]));
      builder.setColorExpression(formatColor([80, 0, 255, 1]));
      builder.setTextureCoordinateExpression(formatArray([0, 0.5, 0.5, 1]));

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
      builder.setSizeExpression(`vec2(${formatNumber(6)})`);
      builder.setSymbolOffsetExpression(formatArray([5, -7]));
      builder.setColorExpression(formatColor([80, 0, 255, 1]));
      builder.setTextureCoordinateExpression(formatArray([0, 0.5, 0.5, 1]));

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
      builder.setSizeExpression(`vec2(${formatNumber(6)})`);
      builder.setSymbolOffsetExpression(formatArray([5, -7]));
      builder.setColorExpression(formatColor([80, 0, 255, 1]));
      builder.setTextureCoordinateExpression(formatArray([0, 0.5, 0.5, 1]));
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
      builder.addVarying('v_opacity', 'float', formatNumber(0.4));
      builder.addVarying('v_test', 'vec3', formatArray([1, 2, 3]));
      builder.setSizeExpression(`vec2(${formatNumber(6)})`);
      builder.setSymbolOffsetExpression(formatArray([5, -7]));
      builder.setColorExpression(formatColor([80, 0, 255]));
      builder.setTextureCoordinateExpression(formatArray([0, 0.5, 0.5, 1]));

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
      builder.setSizeExpression(`vec2(${formatNumber(6)})`);
      builder.setSymbolOffsetExpression(formatArray([5, -7]));
      builder.setColorExpression(formatColor([255, 255, 255, 1]));
      builder.setTextureCoordinateExpression(formatArray([0, 0.5, 0.5, 1]));
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

  describe('check', function() {

    it('does not throw on valid expressions', function(done) {
      check(1);
      check('attr');
      check('rgba(12, 34, 56, 0.5)');
      check([255, 255, 255, 1]);
      check([255, 255, 255]);
      check(['get', 'myAttr']);
      check(['var', 'myValue']);
      check(['time']);
      check(['+', ['*', ['get', 'size'], 0.001], 12]);
      check(['clamp', ['get', 'attr2'], ['get', 'attr3'], 20]);
      check(['stretch', ['get', 'size'], 10, 100, 4, 8]);
      check(['>', 10, ['get', 'attr4']]);
      check(['>=', 10, ['get', 'attr4']]);
      check(['<', 10, ['get', 'attr4']]);
      check(['<=', 10, ['get', 'attr4']]);
      check(['==', 10, ['get', 'attr4']]);
      check(['between', ['get', 'attr4'], -4.0, 5.0]);
      check(['!', ['get', 'attr4']]);
      check(['interpolate', ['get', 'attr4'], 'green', '#3344FF']);
      check(['interpolate', 0.2, [10, 20, 30], [255, 255, 255, 1]]);
      done();
    });

    it('throws on unsupported types for operators', function() {
      let thrown = false;
      try {
        check(['var', 1234]);
      } catch (e) {
        thrown = true;
      }
      try {
        check(['<', 0, 'aa']);
      } catch (e) {
        thrown = true;
      }
      try {
        check(['+', true, ['get', 'attr']]);
      } catch (e) {
        thrown = true;
      }
      try {
        check(['interpolate', ['get', 'attr4'], 1, '#3344FF']);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(true);
    });

    it('throws with the wrong number of arguments', function() {
      let thrown = false;
      try {
        check(['var', 1234, 456]);
      } catch (e) {
        thrown = true;
      }
      try {
        check(['<', 4]);
      } catch (e) {
        thrown = true;
      }
      try {
        check(['+']);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(true);
    });

    it('throws on invalid expressions', function() {
      let thrown = false;
      try {
        check(true);
      } catch (e) {
        thrown = true;
      }
      try {
        check([123, 456]);
      } catch (e) {
        thrown = true;
      }
      try {
        check(null);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(true);
    });

  });

  describe('parse', function() {
    let attributes, prefix, variables, parseFn;

    beforeEach(function() {
      attributes = [];
      variables = [];
      prefix = 'a_';
      parseFn = function(value, type) {
        return parse(value, attributes, prefix, variables, type);
      };
    });

    it('parses expressions & literal values', function() {
      expect(parseFn(1)).to.eql('1.0');
      expect(parseFn('a_random_string')).to.eql('"a_random_string"');
      expect(parseFn([255, 127.5, 63.75, 0.1])).to.eql('vec4(1.0, 0.5, 0.25, 0.1)');
      expect(parseFn([255, 127.5, 63.75])).to.eql('vec4(1.0, 0.5, 0.25, 1.0)');
      expect(parseFn(['get', 'myAttr'])).to.eql('a_myAttr');
      expect(parseFn(['var', 'myValue'])).to.eql('u_myValue');
      expect(parseFn(['time'])).to.eql('u_time');
      expect(parseFn(['+', ['*', ['get', 'size'], 0.001], 12])).to.eql('((a_size * 0.001) + 12.0)');
      expect(parseFn(['clamp', ['get', 'attr2'], ['get', 'attr3'], 20])).to.eql('clamp(a_attr2, a_attr3, 20.0)');
      expect(parseFn(['stretch', ['get', 'size'], 10, 100, 4, 8])).to.eql('(clamp(a_size, 10.0, 100.0) * ((8.0 - 4.0) / (100.0 - 10.0)) + 4.0)');
      expect(parseFn(['>', 10, ['get', 'attr4']])).to.eql('(10.0 > a_attr4 ? 1.0 : 0.0)');
      expect(parseFn(['>=', 10, ['get', 'attr4']])).to.eql('(10.0 >= a_attr4 ? 1.0 : 0.0)');
      expect(parseFn(['<', 10, ['get', 'attr4']])).to.eql('(10.0 < a_attr4 ? 1.0 : 0.0)');
      expect(parseFn(['<=', 10, ['get', 'attr4']])).to.eql('(10.0 <= a_attr4 ? 1.0 : 0.0)');
      expect(parseFn(['==', 10, ['get', 'attr4']])).to.eql('(10.0 == a_attr4 ? 1.0 : 0.0)');
      expect(parseFn(['between', ['get', 'attr4'], -4.0, 5.0])).to.eql('(a_attr4 >= -4.0 && a_attr4 <= 5.0 ? 1.0 : 0.0)');
      expect(parseFn(['!', ['get', 'attr4']])).to.eql('(a_attr4 > 0.0 ? 0.0 : 1.0)');
      expect(parseFn(['interpolate', ['get', 'attr4'], [255, 255, 255, 1], 'transparent'])).to.eql(
        'mix(vec4(1.0, 1.0, 1.0, 1.0), vec4(0.0, 0.0, 0.0, 0.0), a_attr4)');
      expect(attributes).to.eql(['myAttr', 'size', 'attr2', 'attr3', 'attr4']);
      expect(variables).to.eql(['myValue']);
    });

    it('gives precedence to the string type unless asked otherwise', function() {
      expect(parseFn('lightgreen')).to.eql('"lightgreen"');
      expect(parseFn('lightgreen', ValueTypes.COLOR)).to.eql('vec4(0.5647058823529412, 0.9333333333333333, 0.5647058823529412, 1.0)');
    });

    it('does not register an attribute several times', function() {
      parseFn(['get', 'myAttr']);
      parseFn(['var', 'myVar']);
      parseFn(['clamp', ['get', 'attr2'], ['get', 'attr2'], ['get', 'myAttr']]);
      parseFn(['*', ['get', 'attr2'], ['var', 'myVar']]);
      expect(attributes).to.eql(['myAttr', 'attr2']);
      expect(variables).to.eql(['myVar']);
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
        'vec2((clamp(a_population, u_lower, u_higher) * ((8.0 - 4.0) / (u_higher - u_lower)) + 4.0), (clamp(a_population, u_lower, u_higher) * ((8.0 - 4.0) / (u_higher - u_lower)) + 4.0))'
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
      expect(result.builder.discardExpression).to.eql('(v_attr0 >= 0.0 && v_attr0 <= 10.0 ? 1.0 : 0.0) <= 0.0');
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
