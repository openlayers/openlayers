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
      expect(unpackColor(packColor('red'))).to.eql([1, 0, 0, 1]);
      expect(unpackColor(packColor('rgba(0, 255, 255, 0.4)'))).to.eql([
        0, 1, 1, 0.4,
      ]);
      expect(unpackColor(packColor('rgba(51, 51, 0, 0.8)'))).to.eql([
        0.2, 0.2, 0, 0.8,
      ]);
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

      expect(glsl).to.be('(a_prop_size * 3.0 * u_zoom)');
      expect(compilationContext.properties).to.eql({
        size: {name: 'size', type: NumberType},
      });
    });
  });

  describe('getGlslSizeFromType', () => {
    it('returns the amount of components according to type', () => {
      expect(getGlslSizeFromType(ColorType)).to.equal(2);
      expect(getGlslSizeFromType(SizeType)).to.equal(2);
      expect(getGlslSizeFromType(NumberArrayType)).to.equal(4);
      expect(getGlslSizeFromType(NumberType)).to.equal(1);
      expect(getGlslSizeFromType(StringType)).to.equal(1);
    });
  });

  describe('getGlslTypeFromType', () => {
    it('returns the correct GLSL type descriptor', () => {
      expect(getGlslTypeFromType(ColorType)).to.equal('vec2');
      expect(getGlslTypeFromType(SizeType)).to.equal('vec2');
      expect(getGlslTypeFromType(NumberArrayType)).to.equal('vec4');
      expect(getGlslTypeFromType(NumberType)).to.equal('float');
      expect(getGlslTypeFromType(StringType)).to.equal('float');
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
        variables: {myColor: {name: 'myColor', type: ColorType}},
        properties: {
          colorProp: {name: 'colorProp', type: ColorType},
          stringProp: {name: 'stringProp', type: StringType},
        },
        functions: {myFunction: 'function myFunction() { return 1.0; }'},
      };

      applyContextToBuilder(builder, context);

      expect(builder.addUniform.calledWith('u_var_myColor', 'vec4')).to.be(
        true,
      );
      expect(
        builder.addAttribute.calledWith(
          'a_prop_colorProp',
          'vec2',
          'unpackColor(a_prop_colorProp)',
          'vec4',
        ),
      ).to.be(true);
      expect(
        builder.addAttribute.calledWith('a_prop_stringProp', 'float'),
      ).to.be(true);
      expect(
        builder.addVertexShaderFunction.calledWith(
          'function myFunction() { return 1.0; }',
        ),
      ).to.be(true);
      expect(
        builder.addFragmentShaderFunction.calledWith(
          'function myFunction() { return 1.0; }',
        ),
      ).to.be(true);
    });
  });

  describe('generateUniformsFromContext', () => {
    it('generates uniforms', () => {
      const context = {
        variables: {
          colorVar: {name: 'colorVar', type: ColorType},
          anotherColorVar: {name: 'anotherColorVar', type: ColorType},
          stringVar: {name: 'stringVar', type: StringType},
          arrayVar: {name: 'arrayVar', type: NumberArrayType},
          booleanVar: {name: 'booleanVar', type: BooleanType},
        },
      };
      const styleVariables = {
        colorVar: '#FFF',
        anotherColorVar: [51, 102, 0, 0.4],
        stringVar: 'hello world',
        arrayVar: [1, 2, 3],
        booleanVar: true,
      };
      const uniforms = generateUniformsFromContext(context, styleVariables);

      expect(uniforms).to.have.property('u_var_colorVar');
      expect(uniforms).to.have.property('u_var_anotherColorVar');
      expect(uniforms).to.have.property('u_var_stringVar');
      expect(uniforms).to.have.property('u_var_arrayVar');
      expect(uniforms).to.have.property('u_var_booleanVar');
      expect(uniforms.u_var_colorVar()).to.eql([1, 1, 1, 1]);
      expect(uniforms.u_var_anotherColorVar()).to.eql([0.2, 0.4, 0, 0.4]);
      expect(uniforms.u_var_stringVar()).to.eql(stringToGlsl('hello world'));
      expect(uniforms.u_var_arrayVar()).to.eql([1, 2, 3]);
      expect(uniforms.u_var_booleanVar()).to.eql(1);
    });
  });

  describe('generateAttributesFromContext', () => {
    it('generates attributes', () => {
      const context = {
        properties: {
          colorProp: {name: 'colorProp', type: ColorType},
          stringProp: {name: 'stringProp', type: StringType},
          arrayProp: {name: 'arrayProp', type: NumberArrayType},
          booleanProp: {name: 'booleanProp', type: BooleanType},
        },
      };
      const attributes = generateAttributesFromContext(context);

      const feature = new Feature({
        colorProp: '#00ff00',
        stringProp: 'hello world',
        arrayProp: [1, 2, 3],
        booleanProp: true,
      });

      expect(attributes).to.have.property('prop_colorProp');
      expect(attributes.prop_colorProp.size).to.eql(2);
      expect(attributes.prop_colorProp.callback(feature)).to.eql([255, 255]);

      expect(attributes).to.have.property('prop_stringProp');
      expect(attributes.prop_stringProp.size).to.eql(1);
      expect(attributes.prop_stringProp.callback(feature)).to.eql(
        stringToGlsl('hello world'),
      );

      expect(attributes).to.have.property('prop_arrayProp');
      expect(attributes.prop_arrayProp.size).to.eql(4);
      expect(attributes.prop_arrayProp.callback(feature)).to.eql([1, 2, 3]);

      expect(attributes).to.have.property('prop_booleanProp');
      expect(attributes.prop_booleanProp.size).to.eql(1);
      expect(attributes.prop_booleanProp.callback(feature)).to.eql(1);
    });
  });
});
