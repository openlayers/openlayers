import Feature from '../../../../src/ol/Feature.js';
import expect from '../../expect.js';
import {
  AnyType,
  BooleanType,
  ColorType,
  NumberArrayType,
  NumberType,
  StringType,
  newParsingContext,
} from '../../../../src/ol/expr/expression.js';
import {MultiPolygon} from '../../../../src/ol/geom.js';
import {
  arrayToGlsl,
  buildExpression,
  colorToGlsl,
  getStringNumberEquivalent,
  newCompilationContext,
  numberToGlsl,
  stringToGlsl,
} from '../../../../src/ol/expr/gpu.js';

describe('ol/expr/gpu.js', () => {
  describe('numberToGlsl()', () => {
    it('does a simple transform when a fraction is present', () => {
      expect(numberToGlsl(1.3456)).to.eql('1.3456');
    });
    it('adds a fraction separator when missing', () => {
      expect(numberToGlsl(1)).to.eql('1.0');
      expect(numberToGlsl(2.0)).to.eql('2.0');
    });
  });

  describe('arrayToGlsl()', () => {
    it('outputs numbers with dot separators', () => {
      expect(arrayToGlsl([1, 0, 3.45, 0.8888])).to.eql(
        'vec4(1.0, 0.0, 3.45, 0.8888)'
      );
      expect(arrayToGlsl([3, 4])).to.eql('vec2(3.0, 4.0)');
    });
    it('throws on invalid lengths', () => {
      expect(() => arrayToGlsl([3])).to.throwException();
      expect(() => arrayToGlsl([3, 2, 1, 0, -1])).to.throwException();
    });
  });

  describe('colorToGlsl()', () => {
    it('normalizes color and outputs numbers with dot separators, including premultiplied alpha', () => {
      expect(colorToGlsl([100, 0, 255])).to.eql(
        'vec4(0.39215686274509803, 0.0, 1.0, 1.0)'
      );
      expect(colorToGlsl([100, 0, 255, 0.7])).to.eql(
        'vec4(0.2745098039215686, 0.0, 0.7, 0.7)'
      );
    });
    it('handles colors in string format', () => {
      expect(colorToGlsl('red')).to.eql('vec4(1.0, 0.0, 0.0, 1.0)');
      expect(colorToGlsl('#00ff99')).to.eql('vec4(0.0, 1.0, 0.6, 1.0)');
      expect(colorToGlsl('rgb(100, 0, 255)')).to.eql(
        'vec4(0.39215686274509803, 0.0, 1.0, 1.0)'
      );
      expect(colorToGlsl('rgba(100, 0, 255, 0.3)')).to.eql(
        'vec4(0.11764705882352941, 0.0, 0.3, 0.3)'
      );
    });
  });

  describe('stringToGlsl()', () => {
    it('maps input string to stable numbers', () => {
      expect(stringToGlsl('abcd')).to.eql(
        numberToGlsl(getStringNumberEquivalent('abcd'))
      );
      expect(stringToGlsl('defg')).to.eql(
        numberToGlsl(getStringNumberEquivalent('defg'))
      );
      expect(stringToGlsl('hijk')).to.eql(
        numberToGlsl(getStringNumberEquivalent('hijk'))
      );
      expect(stringToGlsl('abcd')).to.eql(
        numberToGlsl(getStringNumberEquivalent('abcd'))
      );
      expect(stringToGlsl('def')).to.eql(
        numberToGlsl(getStringNumberEquivalent('def'))
      );
    });
  });

  describe('buildExpression()', () => {
    /**
     * @typedef {import('../../../../src/ol/expr/gpu.js').CompilationContext} CompilationContext
     */
    /**
     * @typedef {Object} Case
     * @property {string} name The case name.
     * @property {import('../../../../src/ol/expr/expression.js').EncodedExpression} expression The encoded expression.
     * @property {CompilationContext} [context] The evaluation context.
     * @property {number} type The expression type.
     * @property {import('../../../../src/ol/expr/gpu.js').CompiledExpression} [expected] The expected value.
     * @property {function(CompilationContext):void} [contextAssertion] What the context should look like after compilation.
     */

    /**
     * @type {Array<Case>}
     */
    const cases = [
      {
        name: 'boolean literal',
        type: AnyType,
        expression: true,
        expected: 'true',
      },
      // {
      //   name: 'number assertion',
      //   type: AnyType,
      //   expression: ['number', 'not', 'a', 'number', 42, false],
      //   expected: 42,
      // },
      // {
      //   name: 'string assertion',
      //   type: StringType,
      //   expression: ['string', 42, 'chicken', false],
      //   expected: 'chicken',
      // },
      {
        name: 'get',
        type: AnyType,
        expression: ['get', 'myAttr'],
        expected: 'a_prop_myAttr',
      },
      {
        name: 'get (in fragment shader)',
        type: AnyType,
        expression: ['get', 'myAttr'],
        expected: 'v_prop_myAttr',
        context: {
          inFragmentShader: true,
        },
      },
      {
        name: 'var',
        type: AnyType,
        expression: ['var', 'myVar'],
        expected: 'u_var_myVar',
        context: {
          style: {
            variables: {
              myVar: 'abcd',
            },
          },
        },
        contextAssertion: (context) => {
          const variable = context.variables['myVar'];
          expect(variable.name).to.equal('myVar');
          expect(variable.type).to.equal(StringType);
        },
      },
      {
        name: 'geometry-type',
        type: AnyType,
        expression: ['geometry-type'],
        expected: 'a_prop_geometryType',
        contextAssertion: (context) => {
          const prop = context.properties['geometryType'];
          expect(prop.name).to.equal('geometryType');
          expect(prop.type).to.equal(StringType);
          expect(prop.evaluator).to.be.an(Function);
          const feature = new Feature(new MultiPolygon([]));
          expect(prop.evaluator(feature)).to.eql('Polygon');
        },
      },
      {
        name: 'geometry-type (in fragment shader)',
        type: AnyType,
        expression: ['geometry-type'],
        context: {
          inFragmentShader: true,
        },
        expected: 'v_prop_geometryType',
      },
      {
        name: 'time',
        type: AnyType,
        expression: ['time'],
        expected: 'u_time',
      },
      {
        name: 'zoom',
        type: AnyType,
        expression: ['zoom'],
        expected: 'u_zoom',
      },
      {
        name: 'resolution',
        type: AnyType,
        expression: ['resolution'],
        expected: 'u_resolution',
      },
      {
        name: 'addition',
        type: AnyType,
        expression: ['+', 1, 2, 3, 4],
        expected: '(1.0 + 2.0 + 3.0 + 4.0)',
      },
      {
        name: 'addition with property',
        type: AnyType,
        expression: ['+', ['*', ['get', 'size'], 0.001], 12],
        expected: '((a_prop_size * 0.001) + 12.0)',
      },
      {
        name: 'subtraction',
        type: AnyType,
        expression: ['-', ['get', 'number'], 1],
        expected: '(a_prop_number - 1.0)',
      },
      {
        name: 'subtraction with property',
        type: AnyType,
        expression: ['/', ['-', ['get', 'size'], 20], 100],
        expected: '((a_prop_size - 20.0) / 100.0)',
      },
      {
        name: 'multiplication',
        type: AnyType,
        expression: ['*', 2, 4, 6, 8],
        expected: '(2.0 * 4.0 * 6.0 * 8.0)',
      },
      {
        name: 'multiplication (infer string as color)',
        type: AnyType,
        expression: ['*', [255, 127.5, 0, 0.5], 'red'],
        expected: '(vec4(0.5, 0.25, 0.0, 0.5) * vec4(1.0, 0.0, 0.0, 1.0))',
      },
      {
        name: 'division',
        type: AnyType,
        expression: ['/', ['get', 'number'], 2],
        expected: '(a_prop_number / 2.0)',
      },
      {
        name: 'clamp',
        type: AnyType,
        expression: ['clamp', ['get', 'attr2'], ['get', 'attr3'], 20],
        expected: 'clamp(a_prop_attr2, a_prop_attr3, 20.0)',
      },
      {
        name: 'pow',
        type: AnyType,
        expression: ['^', ['%', ['time'], 10], 2],
        expected: 'pow(mod(u_time, 10.0), 2.0)',
      },
      {
        name: 'abs',
        type: AnyType,
        expression: ['abs', ['-', ['get', 'attr3'], ['get', 'attr2']]],
        expected: 'abs((a_prop_attr3 - a_prop_attr2))',
      },

      {
        name: 'floor',
        type: AnyType,
        expression: ['floor', 1],
        expected: 'floor(1.0)',
      },
      {
        name: 'round',
        type: AnyType,
        expression: ['round', 1],
        expected: 'floor(1.0 + 0.5)',
      },
      {
        name: 'ceil',
        type: AnyType,
        expression: ['ceil', 1],
        expected: 'ceil(1.0)',
      },
      {
        name: 'sin',
        type: AnyType,
        expression: ['sin', 1],
        expected: 'sin(1.0)',
      },
      {
        name: 'cos',
        type: AnyType,
        expression: ['cos', 1],
        expected: 'cos(1.0)',
      },
      {
        name: 'atan',
        type: AnyType,
        expression: ['atan', 1],
        expected: 'atan(1.0)',
      },
      {
        name: 'atan (2 params)',
        type: AnyType,
        expression: ['atan', 1, 0.5],
        expected: 'atan(1.0, 0.5)',
      },
      {
        name: 'sqrt',
        type: AnyType,
        expression: ['sqrt', 100],
        expected: 'sqrt(100.0)',
      },

      {
        name: 'greater than',
        type: AnyType,
        expression: ['>', 10, ['get', 'attr4']],
        expected: '(10.0 > a_prop_attr4)',
      },
      {
        name: 'greater than or equal',
        type: AnyType,
        expression: ['>=', 10, ['get', 'attr4']],
        expected: '(10.0 >= a_prop_attr4)',
      },
      {
        name: 'lower than',
        type: AnyType,
        expression: ['<', 10, ['get', 'attr4']],
        expected: '(10.0 < a_prop_attr4)',
      },
      {
        name: 'lower than or equal',
        type: AnyType,
        expression: ['<=', 10, ['get', 'attr4']],
        expected: '(10.0 <= a_prop_attr4)',
      },
      {
        name: 'equal',
        type: AnyType,
        expression: ['==', 10, ['get', 'attr4']],
        expected: '(10.0 == a_prop_attr4)',
      },
      {
        name: 'equal with string property',
        type: AnyType,
        expression: ['==', 'red', ['get', 'attr5']],
        expected: `(${stringToGlsl('red')} == a_prop_attr5)`,
      },
      {
        name: 'unequal',
        type: AnyType,
        expression: ['!=', 10, ['get', 'attr4']],
        expected: '(10.0 != a_prop_attr4)',
      },
      {
        name: 'all',
        type: AnyType,
        expression: ['all', true, ['get', 'attr6']],
        expected: '(true && a_prop_attr6)',
      },
      {
        name: 'any',
        type: AnyType,
        expression: ['any', true, ['get', 'attr6'], true],
        expected: '(true || a_prop_attr6 || true)',
      },
      {
        name: 'between',
        type: AnyType,
        expression: ['between', ['get', 'attr4'], -4.0, 5.0],
        expected: '(a_prop_attr4 >= -4.0 && a_prop_attr4 <= 5.0)',
      },
      {
        name: 'not',
        type: AnyType,
        expression: ['!', ['get', 'attr6']],
        expected: '(!a_prop_attr6)',
      },
      {
        name: 'array constructor',
        type: AnyType,
        expression: ['array', ['get', 'attr4'], 1, 2, 3],
        expected: 'vec4(a_prop_attr4, 1.0, 2.0, 3.0)',
      },
      {
        name: 'color constructor',
        type: AnyType,
        expression: ['color', ['get', 'attr4'], 1, 2, 0.5],
        expected:
          '(0.5 * vec4(a_prop_attr4 / 255.0, 1.0 / 255.0, 2.0 / 255.0, 1.0))',
      },
      {
        name: 'grayscale color',
        type: AnyType,
        expression: ['color', 100],
        expected: 'vec4(vec3(100.0 / 255.0), 1.0)',
      },
      {
        name: 'grayscale color with alpha',
        type: AnyType,
        expression: ['color', 100, 0.5],
        expected: '(0.5 * vec4(vec3(100.0 / 255.0), 1.0))',
      },
      {
        name: 'rgb color',
        type: AnyType,
        expression: ['color', 100, 150, 200],
        expected: 'vec4(100.0 / 255.0, 150.0 / 255.0, 200.0 / 255.0, 1.0)',
      },
      {
        name: 'rgb color with alpha',
        type: AnyType,
        expression: ['color', 100, 150, 200, 0.5],
        expected:
          '(0.5 * vec4(100.0 / 255.0, 150.0 / 255.0, 200.0 / 255.0, 1.0))',
      },
      {
        name: 'band',
        type: AnyType,
        expression: ['band', 1],
        expected: 'getBandValue(1.0, 0.0, 0.0)',
        context: {
          bandCount: 3,
        },
        contextAssertion: (context) => {
          expect(context.functions['getBandValue']).to
            .equal(`float getBandValue(float band, float xOffset, float yOffset) {
  float dx = xOffset / u_texturePixelWidth;
  float dy = yOffset / u_texturePixelHeight;
  if (band == 1.0) {
    return texture2D(u_tileTextures[0], v_textureCoord + vec2(dx, dy))[0];
  }
  if (band == 2.0) {
    return texture2D(u_tileTextures[0], v_textureCoord + vec2(dx, dy))[1];
  }
  if (band == 3.0) {
    return texture2D(u_tileTextures[0], v_textureCoord + vec2(dx, dy))[2];
  }

}`);
        },
      },
      {
        name: 'band with offsets',
        type: AnyType,
        expression: ['band', 1, -1, 2],
        expected: 'getBandValue(1.0, -1.0, 2.0)',
      },
      {
        name: 'colors as strings',
        type: ColorType,
        expression: [
          'case',
          ['>', ['get', 'attr'], 3],
          'red',
          ['>', ['get', 'attr'], 1],
          'yellow',
          'white',
        ],
        expected:
          '((a_prop_attr > 3.0) ? vec4(1.0, 0.0, 0.0, 1.0) : ((a_prop_attr > 1.0) ? vec4(1.0, 1.0, 0.0, 1.0) : vec4(1.0, 1.0, 1.0, 1.0)))',
      },
      {
        name: 'match (colors)',
        type: ColorType,
        expression: ['match', ['get', 'attr'], 0, 'red', 1, 'yellow', 'white'],
        expected:
          '(a_prop_attr == 0.0 ? vec4(1.0, 0.0, 0.0, 1.0) : (a_prop_attr == 1.0 ? vec4(1.0, 1.0, 0.0, 1.0) : vec4(1.0, 1.0, 1.0, 1.0)))',
      },
      {
        name: 'match (strings)',
        type: StringType,
        expression: ['match', ['get', 'attr'], 0, 'red', 1, 'yellow', 'white'],
        expected: `(a_prop_attr == 0.0 ? ${stringToGlsl(
          'red'
        )} : (a_prop_attr == 1.0 ? ${stringToGlsl('yellow')} : ${stringToGlsl(
          'white'
        )}))`,
      },
      {
        name: 'match (number arrays)',
        type: NumberArrayType,
        expression: [
          'match',
          ['get', 'attr'],
          'low',
          [0, 0],
          'high',
          [0, 1],
          [1, 0],
        ],
        expected: `(a_prop_attr == ${stringToGlsl(
          'low'
        )} ? vec2(0.0, 0.0) : (a_prop_attr == ${stringToGlsl(
          'high'
        )} ? vec2(0.0, 1.0) : vec2(1.0, 0.0)))`,
      },
      {
        name: 'match (larger number arrays)',
        type: NumberArrayType,
        expression: [
          'match',
          ['get', 'attr2'],
          0,
          [0, 0, 1, 1],
          1,
          [1, 1, 2, 2],
          2,
          [2, 2, 3, 3],
          [3, 3, 4, 4],
        ],
        expected:
          '(a_prop_attr2 == 0.0 ? vec4(0.0, 0.0, 1.0, 1.0) : (a_prop_attr2 == 1.0 ? vec4(1.0, 1.0, 2.0, 2.0) : (a_prop_attr2 == 2.0 ? vec4(2.0, 2.0, 3.0, 3.0) : vec4(3.0, 3.0, 4.0, 4.0))))',
      },
      {
        name: 'interpolate (colors, linear)',
        expression: [
          'interpolate',
          ['linear'],
          ['get', 'attr'],
          1000,
          [255, 0, 0],
          2000,
          [0, 255, 0],
          5000,
          [0, 0, 255],
        ],
        type: AnyType,
        expected:
          'mix(mix(vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 1.0, 0.0, 1.0), clamp((a_prop_attr - 1000.0) / (2000.0 - 1000.0), 0.0, 1.0)), vec4(0.0, 0.0, 1.0, 1.0), clamp((a_prop_attr - 2000.0) / (5000.0 - 2000.0), 0.0, 1.0))',
      },
      {
        name: 'interpolate (numbers, linear)',
        expression: [
          'interpolate',
          ['linear'],
          ['get', 'attr'],
          1000,
          -10,
          2000,
          0,
          5000,
          10,
        ],
        type: AnyType,
        expected:
          'mix(mix(-10.0, 0.0, clamp((a_prop_attr - 1000.0) / (2000.0 - 1000.0), 0.0, 1.0)), 10.0, clamp((a_prop_attr - 2000.0) / (5000.0 - 2000.0), 0.0, 1.0))',
      },
      {
        name: 'interpolate (numbers, exponential)',
        expression: [
          'interpolate',
          ['exponential', 0.5],
          ['get', 'attr'],
          1000,
          -10,
          2000,
          0,
          5000,
          10,
        ],
        type: AnyType,
        expected:
          'mix(mix(-10.0, 0.0, clamp((pow(0.5, (a_prop_attr - 1000.0)) - 1.0) / (pow(0.5, (2000.0 - 1000.0)) - 1.0), 0.0, 1.0)), 10.0, clamp((pow(0.5, (a_prop_attr - 2000.0)) - 1.0) / (pow(0.5, (5000.0 - 2000.0)) - 1.0), 0.0, 1.0))',
      },
      {
        name: 'in (number haystack)',
        expression: ['in', ['get', 'attr'], [0, 20, 50]],
        type: AnyType,
        context: {
          functions: {
            'a_function': 'float a_function() { return 1.0; }',
            'another_function': 'float another_function() { return 1.0; }',
          },
        },
        expected: 'operator_in_2(a_prop_attr)',
        contextAssertion: (context) => {
          expect(context.functions['operator_in_2']).to
            .equal(`bool operator_in_2(float inputValue) {
  if (inputValue == 0.0) { return true; }
  if (inputValue == 20.0) { return true; }
  if (inputValue == 50.0) { return true; }
  return false;
}`);
        },
      },
      {
        name: 'in (string haystack)',
        expression: ['in', ['get', 'attr'], ['literal', ['abc', 'def', 'ghi']]],
        type: AnyType,
        expected: 'operator_in_0(a_prop_attr)',
        contextAssertion: (context) => {
          expect(context.functions['operator_in_0']).to
            .equal(`bool operator_in_0(float inputValue) {
  if (inputValue == ${stringToGlsl('abc')}) { return true; }
  if (inputValue == ${stringToGlsl('def')}) { return true; }
  if (inputValue == ${stringToGlsl('ghi')}) { return true; }
  return false;
}`);
        },
      },
      {
        name: 'palette',
        expression: [
          'palette',
          ['get', 'color'],
          ['red', 'rgb(0, 255, 0)', [0, 0, 255, 0.5]],
        ],
        type: AnyType,
        expected:
          'texture2D(u_paletteTextures[0], vec2((a_prop_color + 0.5) / 3.0, 0.5))',
        contextAssertion: (context) => {
          expect(context.paletteTextures[0]).to.eql({
            name: 'u_paletteTextures[0]',
            data: Uint8Array.from([
              // red
              255, 0, 0, 255,
              // green
              0, 255, 0, 255,
              // blue, 0.5 alpha
              0, 0, 255, 127,
            ]),
            texture_: null,
          });
        },
      },
      {
        name: 'combination of interpolate, match, color and number',
        type: ColorType,
        expression: [
          'interpolate',
          ['linear'],
          [
            '^',
            [
              '/',
              [
                '%',
                [
                  '+',
                  ['time'],
                  [
                    'interpolate',
                    ['linear'],
                    ['get', 'year'],
                    1850,
                    0,
                    2015,
                    8,
                  ],
                ],
                8,
              ],
              8,
            ],
            0.5,
          ],
          0,
          'rgba(255, 255, 0, 0.5)',
          1,
          ['match', ['get', 'year'], 2000, 'green', '#ffe52c'],
        ],
        expected:
          'mix(vec4(0.5, 0.5, 0.0, 0.5), (a_prop_year == 2000.0 ? vec4(0.0, 0.5019607843137255, 0.0, 1.0) : vec4(1.0, 0.8980392156862745, 0.17254901960784313, 1.0)), clamp((pow((mod((u_time + mix(0.0, 8.0, clamp((a_prop_year - 1850.0) / (2015.0 - 1850.0), 0.0, 1.0))), 8.0) / 8.0), 0.5) - 0.0) / (1.0 - 0.0), 0.0, 1.0))',
      },
      {
        name: 'array for symbol size',
        type: NumberType | NumberArrayType,
        expression: [
          'array',
          [
            'ceil',
            [
              'match',
              ['get', 'width'],
              0,
              ['var', 'defaultWidth'],
              ['get', 'width'],
            ],
          ],
          [
            'ceil',
            [
              'match',
              ['get', 'height'],
              0,
              ['var', 'defaultHeight'],
              ['get', 'height'],
            ],
          ],
        ],
        context: {
          style: {
            variables: {
              defaultWidth: 16,
              defaultHeight: 32,
            },
          },
        },
        expected:
          'vec2(ceil((a_prop_width == 0.0 ? u_var_defaultWidth : a_prop_width)), ceil((a_prop_height == 0.0 ? u_var_defaultHeight : a_prop_height)))',
      },
      {
        name: 'mix of var and get operators (color)',
        expression: [
          'match',
          ['var', 'selected'],
          false,
          'red',
          ['get', 'validValue'],
          'green',
          [
            'case',
            ['<', ['time'], 10000],
            ['var', 'oldColor'],
            ['var', 'newColor'],
          ],
        ],
        type: ColorType,
        context: {
          style: {
            variables: {
              selected: true,
              oldColor: 'grey',
              newColor: 'white',
            },
          },
        },
        expected:
          '(u_var_selected == false ? vec4(1.0, 0.0, 0.0, 1.0) : (u_var_selected == a_prop_validValue ? vec4(0.0, 0.5019607843137255, 0.0, 1.0) : ((u_time < 10000.0) ? u_var_oldColor : u_var_newColor)))',
        contextAssertion: (context) => {
          expect(context.properties).to.eql({
            validValue: {name: 'validValue', type: BooleanType},
          });
          expect(context.variables).to.eql({
            selected: {name: 'selected', type: BooleanType},
            newColor: {name: 'newColor', type: ColorType},
            oldColor: {name: 'oldColor', type: ColorType},
          });
        },
      },
      {
        name: 'mix of var and get operators (number array)',
        expression: [
          'case',
          ['==', ['var', 'symbolType'], 'dynamic'],
          [
            'array',
            [
              'match',
              ['get', 'type'],
              'low',
              ['var', 'lowHeight'],
              'medium',
              ['var', 'mediumHeight'],
              ['get', 'height'],
            ],
            10,
          ],
          ['var', 'fixedSize'],
        ],
        type: AnyType,
        context: {
          style: {
            variables: {
              fixedSize: [10, 20],
              symbolType: 'dynamic',
              lowHeight: 6,
              mediumHeight: 12,
            },
          },
        },
        expected:
          '((u_var_symbolType == 11.0) ? vec2((a_prop_type == 3.0 ? u_var_lowHeight : (a_prop_type == 12.0 ? u_var_mediumHeight : a_prop_height)), 10.0) : u_var_fixedSize)',
        contextAssertion: (context) => {
          expect(context.properties).to.eql({
            type: {
              name: 'type',
              type: StringType,
            },
            height: {
              name: 'height',
              type: NumberType,
            },
          });
          expect(context.variables).to.eql({
            fixedSize: {
              name: 'fixedSize',
              type: NumberArrayType,
            },
            symbolType: {
              name: 'symbolType',
              type: StringType,
            },
            mediumHeight: {
              name: 'mediumHeight',
              type: NumberType,
            },
            lowHeight: {
              name: 'lowHeight',
              type: NumberType,
            },
          });
        },
      },
    ];

    for (const c of cases) {
      it(`works for ${c.name}`, () => {
        const parsingContext = newParsingContext();
        const compilationContext = c.context
          ? {...newCompilationContext(), ...c.context}
          : newCompilationContext();
        parsingContext.style = compilationContext.style;
        const result = buildExpression(
          c.expression,
          c.type,
          parsingContext,
          compilationContext
        );
        expect(result).to.eql(c.expected);
        if (c.contextAssertion) {
          c.contextAssertion(compilationContext);
        }
      });
    }
  });

  describe('buildExpression() exceptions', () => {
    /**
     * @typedef {import('../../../../src/ol/expr/gpu.js').CompilationContext} CompilationContext
     */
    /**
     * @typedef {Object} Case
     * @property {string} name The case name.
     * @property {import('../../../../src/ol/expr/expression.js').EncodedExpression} expression The encoded expression.
     * @property {CompilationContext} [context] The evaluation context.
     * @property {number} type The expression type.
     * @property {boolean|string} exception If true, simply expects the compilation to throw; a string will be compared to the error message
     */

    /**
     * @type {Array<Case>}
     */
    const cases = [
      {
        name: 'expected type not matching actual type',
        expression: '42',
        type: NumberType,
        exception: 'Expected expression to be of type number, got string',
      },
      {
        name: 'argument type unexpected (var)',
        expression: ['var', 1234],
        exception: true,
      },
      {
        name: 'argument type unexpected (any)',
        expression: ['any', ['var', 'aa'], 10],
        exception: true,
      },
      {
        name: 'argument type unexpected (all)',
        expression: ['all', ['var', 'aa'], 10],
        exception: true,
      },
      {
        name: 'argument type unexpected (<)',
        expression: ['<', 0, 'aa'],
        exception: true,
      },
      {
        name: 'argument type unexpected (+)',
        expression: ['+', true, ['get', 'attr']],
        exception: true,
      },
      {
        name: 'argument type unexpected (color)',
        expression: ['color', 1, 2, 'red'],
        exception: true,
      },
      {
        name: 'argument type unexpected (array)',
        expression: ['array', 1, '2', 3],
        exception: true,
      },
      {
        name: 'expected type not matching actual type (case)',
        type: NumberType,
        expression: ['case', false, 'red', true, 'yellow', 'green'],
        exception: true,
      },
      {
        name: 'expected type not matching actual type (interpolate)',
        expression: [
          'interpolate',
          ['linear'],
          ['get', 'attr'],
          1000,
          -10,
          2000,
          10,
        ],
        type: ColorType,
        exception: true,
      },
      {
        name: 'expected type not matching actual type (match)',
        type: NumberType,
        expression: ['match', ['get', 'attr'], 0, 'red', 1, 'yellow', 'green'],
        exception: true,
      },
    ];

    for (const c of cases) {
      it(`throws for ${c.name}`, () => {
        const parsingContext = newParsingContext();
        const compilationContext = c.context
          ? {...newCompilationContext(), ...c.context}
          : newCompilationContext();
        parsingContext.style = compilationContext.style;
        const build = () =>
          buildExpression(
            c.expression,
            c.type,
            parsingContext,
            compilationContext
          );
        if (c.exception === true) {
          expect(build).to.throwException();
        } else {
          expect(build).to.throwError((e) =>
            expect(e.message).to.eql(c.exception)
          );
        }
      });
    }
  });
});
