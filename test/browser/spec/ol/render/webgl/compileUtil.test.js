import {assert} from 'chai';
import {stub as sinonStub} from 'sinon';
import Feature from '../../../../../../src/ol/Feature.js';
import {
  BooleanType,
  ColorType,
  NumberArrayType,
  NumberType,
  SizeType,
  StringType,
} from '../../../../../../src/ol/expr/expression.js';
import {
  newCompilationContext,
  stringToGlsl,
} from '../../../../../../src/ol/expr/gpu.js';
import {
  applyContextToBuilder,
  expressionToGlsl,
  generateAttributesFromContext,
  generateUniformsFromContext,
  getGlslSizeFromType,
  getGlslTypeFromType,
  packColor,
  unpackColor,
} from '../../../../../../src/ol/render/webgl/compileUtil.js';

describe('ol/render/webgl/compileUtil', () => {
  describe('packColor and unpackColor', () => {
    it('unpacks colors from packed colors correctly', () => {
      assert.deepEqual(unpackColor(packColor('red')), [1, 0, 0, 1]);
      assert.deepEqual(
        unpackColor(packColor('rgba(0, 255, 255, 0.4)')),
        [0, 1, 1, 0.4],
      );
      assert.deepEqual(
        unpackColor(packColor('rgba(51, 51, 0, 0.8)')),
        [0.2, 0.2, 0, 0.8],
      );
    });
  });

  describe('expressionToGlsl', () => {
    it('generates a GLSL snippet from an expression', () => {
      const compilationContext = newCompilationContext();
      const glsl = expressionToGlsl(
        compilationContext,
        ['*', ['get', 'size'], 3, ['zoom']],
        NumberType,
      );

      assert.strictEqual(glsl, '(a_prop_size * 3.0 * u_zoom)');
      assert.deepEqual(Array.from(compilationContext.properties), [
        ['size', NumberType],
      ]);
    });
  });

  describe('getGlslSizeFromType', () => {
    it('returns the amount of components according to type', () => {
      assert.equal(getGlslSizeFromType(ColorType), 2);
      assert.equal(getGlslSizeFromType(SizeType), 2);
      assert.equal(getGlslSizeFromType(NumberArrayType), 4);
      assert.equal(getGlslSizeFromType(NumberType), 1);
      assert.equal(getGlslSizeFromType(StringType), 1);
    });
  });

  describe('getGlslTypeFromType', () => {
    it('returns the correct GLSL type descriptor', () => {
      assert.equal(getGlslTypeFromType(ColorType), 'vec2');
      assert.equal(getGlslTypeFromType(SizeType), 'vec2');
      assert.equal(getGlslTypeFromType(NumberArrayType), 'vec4');
      assert.equal(getGlslTypeFromType(NumberType), 'float');
      assert.equal(getGlslTypeFromType(StringType), 'float');
    });
  });

  describe('applyContextToBuilder', () => {
    it('registers variables as uniforms, properties as attributes and functions in the builder', () => {
      const builder = {
        addUniform: sinonStub(),
        addAttribute: sinonStub(),
        addVertexShaderFunction: sinonStub(),
        addFragmentShaderFunction: sinonStub(),
      };
      const context = {
        variables: new Map([['myColor', ColorType]]),
        properties: new Map([
          ['colorProp', ColorType],
          ['stringProp', StringType],
        ]),
        functions: {myFunction: 'function myFunction() { return 1.0; }'},
      };

      applyContextToBuilder(builder, context);

      assert.strictEqual(
        builder.addUniform.calledWith('u_var_myColor', 'vec4'),
        true,
      );
      assert.strictEqual(
        builder.addAttribute.calledWith(
          'a_prop_colorProp',
          'vec2',
          'unpackColor(a_prop_colorProp)',
          'vec4',
        ),
        true,
      );
      assert.strictEqual(
        builder.addAttribute.calledWith('a_prop_stringProp', 'float'),
        true,
      );
      assert.strictEqual(
        builder.addVertexShaderFunction.calledWith(
          'function myFunction() { return 1.0; }',
        ),
        true,
      );
      assert.strictEqual(
        builder.addFragmentShaderFunction.calledWith(
          'function myFunction() { return 1.0; }',
        ),
        true,
      );
    });
  });

  describe('generateUniformsFromContext', () => {
    it('generates uniforms', () => {
      const context = {
        variables: new Map([
          ['colorVar', ColorType],
          ['anotherColorVar', ColorType],
          ['stringVar', StringType],
          ['arrayVar', NumberArrayType],
          ['booleanVar', BooleanType],
        ]),
      };
      const styleVariables = {
        colorVar: '#FFF',
        anotherColorVar: [51, 102, 0, 0.4],
        stringVar: 'hello world',
        arrayVar: [1, 2, 3],
        booleanVar: true,
      };
      const uniforms = generateUniformsFromContext(context, styleVariables);

      assert.property(uniforms, 'u_var_colorVar');
      assert.property(uniforms, 'u_var_anotherColorVar');
      assert.property(uniforms, 'u_var_stringVar');
      assert.property(uniforms, 'u_var_arrayVar');
      assert.property(uniforms, 'u_var_booleanVar');
      assert.deepEqual(uniforms.u_var_colorVar(), [1, 1, 1, 1]);
      assert.deepEqual(uniforms.u_var_anotherColorVar(), [0.2, 0.4, 0, 0.4]);
      assert.equal(uniforms.u_var_stringVar(), stringToGlsl('hello world'));
      assert.deepEqual(uniforms.u_var_arrayVar(), [1, 2, 3]);
      assert.deepEqual(uniforms.u_var_booleanVar(), 1);
    });
  });

  describe('generateAttributesFromContext', () => {
    it('generates attributes', () => {
      const context = {
        properties: new Map([
          ['colorProp', ColorType],
          ['stringProp', StringType],
          ['arrayProp', NumberArrayType],
          ['booleanProp', BooleanType],
        ]),
      };
      const attributes = generateAttributesFromContext(context);

      const feature = new Feature({
        colorProp: '#00ff00',
        stringProp: 'hello world',
        arrayProp: [1, 2, 3],
        booleanProp: true,
      });

      assert.property(attributes, 'prop_colorProp');
      assert.deepEqual(attributes.prop_colorProp.size, 2);
      assert.deepEqual(attributes.prop_colorProp.callback(feature), [255, 255]);

      assert.property(attributes, 'prop_stringProp');
      assert.deepEqual(attributes.prop_stringProp.size, 1);
      assert.equal(
        attributes.prop_stringProp.callback(feature),
        stringToGlsl('hello world'),
      );

      assert.property(attributes, 'prop_arrayProp');
      assert.deepEqual(attributes.prop_arrayProp.size, 4);
      assert.deepEqual(attributes.prop_arrayProp.callback(feature), [1, 2, 3]);

      assert.property(attributes, 'prop_booleanProp');
      assert.deepEqual(attributes.prop_booleanProp.size, 1);
      assert.deepEqual(attributes.prop_booleanProp.callback(feature), 1);
    });
  });
});
