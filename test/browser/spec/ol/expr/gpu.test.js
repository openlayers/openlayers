import {
  AnyType,
  BooleanType,
  ColorType,
  NumberType,
  StringType,
  newParsingContext,
} from '../../../../../src/ol/expr/expression.js';
import {
  buildExpression,
  colorToGlsl,
  newCompilationContext,
} from '../../../../../src/ol/expr/gpu.js';

describe('ol/expr/gpu', () => {
  describe('colorToGlsl()', () => {
    it('handles colors in string format', () => {
      expect(colorToGlsl('red')).to.eql('vec4(1.0, 0.0, 0.0, 1.0)');
      expect(colorToGlsl('#00ff99')).to.eql('vec4(0.0, 1.0, 0.6, 1.0)');
      expect(colorToGlsl('rgb(100, 0, 255)')).to.eql(
        'vec4(0.39215686274509803, 0.0, 1.0, 1.0)',
      );
      expect(colorToGlsl('rgba(100, 0, 255, 0.3)')).to.eql(
        'vec4(0.39215686274509803, 0.0, 1.0, 0.3)',
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
        name: 'multiplication (infer string as color)',
        type: ColorType,
        expression: ['*', [255, 127.5, 0, 0.5], 'red'],
        expected: '(vec4(1.0, 0.5, 0.0, 0.5) * vec4(1.0, 0.0, 0.0, 1.0))',
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
          'mix(vec4(1.0, 1.0, 0.0, 0.5), (a_prop_year == 2000.0 ? vec4(0.0, 0.5019607843137255, 0.0, 1.0) : vec4(1.0, 0.8980392156862745, 0.17254901960784313, 1.0)), clamp((pow((mod((u_time + mix(0.0, 8.0, clamp((a_prop_year - 1850.0) / (2015.0 - 1850.0), 0.0, 1.0))), 8.0) / 8.0), 0.5) - 0.0) / (1.0 - 0.0), 0.0, 1.0))',
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
            validValue: {
              name: 'validValue',
              type: StringType | NumberType | BooleanType,
            },
          });
          expect(context.variables).to.eql({
            selected: {
              name: 'selected',
              type: StringType | NumberType | BooleanType,
            },
            newColor: {name: 'newColor', type: ColorType},
            oldColor: {name: 'oldColor', type: ColorType},
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
          compilationContext,
        );
        expect(result).to.eql(c.expected);
        if (c.contextAssertion) {
          c.contextAssertion(compilationContext);
        }
      });
    }
  });
});
