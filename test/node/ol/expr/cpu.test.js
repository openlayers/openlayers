import {
  buildExpression,
  newEvaluationContext,
} from '../../../../src/ol/expr/cpu.js';
import {
  BooleanType,
  ColorType,
  NumberArrayType,
  NumberType,
  StringType,
  newParsingContext,
} from '../../../../src/ol/expr/expression.js';
import expect from '../../expect.js';

describe('ol/expr/cpu.js', () => {
  describe('buildExpression()', () => {
    /**
     * @typedef {Object} Case
     * @property {string} name The case name.
     * @property {import('../../../../src/ol/expr/expression.js').EncodedExpression} expression The encoded expression.
     * @property {import('../../../../src/ol/expr/cpu.js').EvaluationContext} [context] The evaluation context.
     * @property {number} type The expression type.
     * @property {import('../../../../src/ol/expr/expression.js').LiteralValue} expected The expected value.
     * @property {number} [tolerance] Optional tolerance for numeric comparisons.
     */

    /**
     * @type {Array<Case>}
     */
    const cases = [
      {
        name: 'get',
        context: {
          properties: {
            property: 42,
          },
        },
        expression: ['get', 'property'],
        type: NumberType,
        expected: 42,
      },
      {
        name: 'get (nested)',
        context: {
          properties: {
            deeply: {nested: {property: 42}},
          },
        },
        expression: ['get', 'deeply', 'nested', 'property'],
        type: NumberType,
        expected: 42,
      },
      {
        name: 'get number (excess key)',
        context: {
          properties: {
            property: 42,
          },
        },
        expression: ['get', 'property', 'nothing_here'],
        type: NumberType,
        expected: undefined,
      },
      {
        name: 'get array item',
        context: {
          properties: {
            values: [17, 42],
          },
        },
        expression: ['get', 'values', 1],
        type: NumberType,
        expected: 42,
      },
      {
        name: 'get array',
        context: {
          properties: {
            values: [17, 42],
          },
        },
        expression: ['get', 'values'],
        type: NumberArrayType,
        expected: [17, 42],
      },
      {
        name: 'boolean literal (true)',
        type: BooleanType,
        expression: true,
        expected: true,
      },
      {
        name: 'boolean literal (false)',
        type: BooleanType,
        expression: false,
        expected: false,
      },
      {
        name: 'number assertion',
        type: NumberType,
        expression: ['number', 'not', 'a', 'number', 42, false],
        expected: 42,
      },
      {
        name: 'string assertion',
        type: StringType,
        expression: ['string', 42, 'chicken', false],
        expected: 'chicken',
      },
      {
        name: 'id (number)',
        type: NumberType,
        expression: ['id'],
        context: {
          featureId: 42,
        },
        expected: 42,
      },
      {
        name: 'id (string)',
        type: StringType,
        expression: ['id'],
        context: {
          featureId: 'forty-two',
        },
        expected: 'forty-two',
      },
      {
        name: 'geometry-type',
        type: StringType,
        expression: ['geometry-type'],
        context: {
          geometryType: 'LineString',
        },
        expected: 'LineString',
      },
      {
        name: 'geometry-type (empty)',
        type: StringType,
        expression: ['geometry-type'],
        context: {
          geometryType: '',
        },
        expected: '',
      },
      {
        name: 'resolution',
        type: NumberType,
        expression: ['resolution'],
        context: {
          resolution: 10,
        },
        expected: 10,
      },
      {
        name: 'resolution (comparison)',
        type: BooleanType,
        expression: ['>', ['resolution'], 10],
        context: {
          resolution: 11,
        },
        expected: true,
      },
      {
        name: 'concat (2 arguments)',
        type: StringType,
        expression: ['concat', ['get', 'val'], ' '],
        context: {
          properties: {val: 'test'},
        },
        expected: 'test ',
      },
      {
        name: 'concat (3 arguments)',
        type: StringType,
        expression: ['concat', ['get', 'val'], ' ', ['get', 'val2']],
        context: {
          properties: {val: 'test', val2: 'another'},
        },
        expected: 'test another',
      },
      {
        name: 'concat (with id)',
        type: StringType,
        expression: ['concat', 'Feature ', ['id']],
        context: {
          featureId: 'foo',
        },
        expected: 'Feature foo',
      },
      {
        name: 'concat (with string and number)',
        type: StringType,
        expression: ['concat', 'number ', 1],
        expected: 'number 1',
      },
      {
        name: 'coalesce (2 arguments, first has a value)',
        type: StringType,
        expression: ['coalesce', ['get', 'val'], 'default'],
        context: {
          properties: {val: 'test'},
        },
        expected: 'test',
      },
      {
        name: 'coalesce (2 arguments, first has no value)',
        type: StringType,
        expression: ['coalesce', ['get', 'val'], 'default'],
        context: {
          properties: {},
        },
        expected: 'default',
      },
      {
        name: 'coalesce (several arguments, first few have no value)',
        type: StringType,
        expression: [
          'coalesce',
          ['get', 'val'],
          ['get', 'beer'],
          ['get', 'present'],
          'last resort',
        ],
        context: {
          properties: {present: 'hello world'},
        },
        expected: 'hello world',
      },
      {
        name: 'any (true)',
        type: BooleanType,
        expression: ['any', ['get', 'nope'], ['get', 'yep'], ['get', 'nope']],
        context: {
          properties: {nope: false, yep: true},
        },
        expected: true,
      },
      {
        name: 'any (false)',
        type: BooleanType,
        expression: ['any', ['get', 'nope'], false, ['!', ['get', 'yep']]],
        context: {
          properties: {nope: false, yep: true},
        },
        expected: false,
      },
      {
        name: 'all (true)',
        type: BooleanType,
        expression: ['all', ['get', 'yep'], true, ['!', ['get', 'nope']]],
        context: {
          properties: {yep: true, nope: false},
        },
        expected: true,
      },
      {
        name: 'all (false)',
        type: BooleanType,
        expression: ['all', ['!', ['get', 'nope']], ['get', 'yep'], false],
        context: {
          properties: {nope: false, yep: true},
        },
        expected: false,
      },
      {
        name: 'not (true)',
        type: BooleanType,
        expression: ['!', ['get', 'nope']],
        context: {
          properties: {nope: false, yep: true},
        },
        expected: true,
      },
      {
        name: 'not (false)',
        type: BooleanType,
        expression: ['!', ['get', 'yep']],
        context: {
          properties: {nope: false, yep: true},
        },
        expected: false,
      },
      {
        name: 'equal comparison (true)',
        type: BooleanType,
        expression: ['==', ['get', 'number'], 42],
        context: {
          properties: {number: 42},
        },
        expected: true,
      },
      {
        name: 'equal comparison (false)',
        type: BooleanType,
        expression: ['==', ['get', 'number'], 1],
        context: {
          properties: {number: 42},
        },
        expected: false,
      },
      {
        name: 'greater than comparison (true)',
        type: BooleanType,
        expression: ['>', ['get', 'number'], 40],
        context: {
          properties: {number: 42},
        },
        expected: true,
      },
      {
        name: 'greater than comparison (false)',
        type: BooleanType,
        expression: ['>', ['get', 'number'], 44],
        context: {
          properties: {number: 42},
        },
        expected: false,
      },
      {
        name: 'greater than or equal comparison (true)',
        type: BooleanType,
        expression: ['>=', ['get', 'number'], 42],
        context: {
          properties: {number: 42},
        },
        expected: true,
      },
      {
        name: 'greater than or equal comparison (false)',
        type: BooleanType,
        expression: ['>=', ['get', 'number'], 43],
        context: {
          properties: {number: 42},
        },
        expected: false,
      },
      {
        name: 'less than comparison (true)',
        type: BooleanType,
        expression: ['<', ['get', 'number'], 44],
        context: {
          properties: {number: 42},
        },
        expected: true,
      },
      {
        name: 'less than comparison (false)',
        type: BooleanType,
        expression: ['<', ['get', 'number'], 1],
        context: {
          properties: {number: 42},
        },
        expected: false,
      },
      {
        name: 'less than or equal comparison (true)',
        type: BooleanType,
        expression: ['<=', ['get', 'number'], 42],
        context: {
          properties: {number: 42},
        },
        expected: true,
      },
      {
        name: 'less than or equal comparison (false)',
        type: BooleanType,
        expression: ['<=', ['get', 'number'], 41],
        context: {
          properties: {number: 42},
        },
        expected: false,
      },
      {
        name: 'addition',
        type: NumberType,
        expression: ['+', ['get', 'number'], 1],
        context: {
          properties: {number: 42},
        },
        expected: 43,
      },
      {
        name: 'addition (many values)',
        type: NumberType,
        expression: ['+', 1, 2, 3, 4],
        expected: 1 + 2 + 3 + 4,
      },
      {
        name: 'subtraction',
        type: NumberType,
        expression: ['-', ['get', 'number'], 1],
        context: {
          properties: {number: 42},
        },
        expected: 41,
      },
      {
        name: 'subtraction',
        type: NumberType,
        expression: ['-', ['get', 'number'], 1],
        context: {
          properties: {number: 42},
        },
        expected: 41,
      },
      {
        name: 'multiplication',
        type: NumberType,
        expression: ['*', ['get', 'number'], 2],
        context: {
          properties: {number: 42},
        },
        expected: 84,
      },
      {
        name: 'multiplication (many values)',
        type: NumberType,
        expression: ['*', 2, 4, 6, 8],
        expected: 2 * 4 * 6 * 8,
      },
      {
        name: 'division',
        type: NumberType,
        expression: ['/', ['get', 'number'], 2],
        context: {
          properties: {number: 42},
        },
        expected: 21,
      },
      {
        name: 'clamp (min)',
        type: NumberType,
        expression: ['clamp', -10, 0, 50],
        expected: 0,
      },
      {
        name: 'clamp (max)',
        type: NumberType,
        expression: ['clamp', 100, 0, 50],
        expected: 50,
      },
      {
        name: 'clamp (mid)',
        type: NumberType,
        expression: ['clamp', 25, 0, 50],
        expected: 25,
      },
      {
        name: 'clamp (mid)',
        type: NumberType,
        expression: ['clamp', 25, 0, 50],
        expected: 25,
      },
      {
        name: 'mod',
        type: NumberType,
        expression: ['%', ['get', 'number'], 10],
        context: {
          properties: {number: 42},
        },
        expected: 2,
      },
      {
        name: 'pow',
        type: NumberType,
        expression: ['^', ['get', 'number'], 2],
        context: {
          properties: {number: 42},
        },
        expected: 1764,
      },
      {
        name: 'abs',
        type: NumberType,
        expression: ['abs', ['get', 'number']],
        context: {
          properties: {number: -42},
        },
        expected: 42,
      },
      {
        name: 'floor',
        type: NumberType,
        expression: ['floor', ['get', 'number']],
        context: {
          properties: {number: 42.9},
        },
        expected: 42,
      },
      {
        name: 'ceil',
        type: NumberType,
        expression: ['ceil', ['get', 'number']],
        context: {
          properties: {number: 42.1},
        },
        expected: 43,
      },
      {
        name: 'round',
        type: NumberType,
        expression: ['round', ['get', 'number']],
        context: {
          properties: {number: 42.5},
        },
        expected: 43,
      },
      {
        name: 'sin',
        type: NumberType,
        expression: ['sin', ['get', 'angle']],
        context: {
          properties: {angle: Math.PI / 2},
        },
        expected: 1,
      },
      {
        name: 'cos',
        type: NumberType,
        expression: ['cos', ['get', 'angle']],
        context: {
          properties: {angle: Math.PI},
        },
        expected: -1,
      },
      {
        name: 'atan (1)',
        type: NumberType,
        expression: ['atan', 1],
        expected: Math.atan(1),
      },
      {
        name: 'atan (2)',
        type: NumberType,
        expression: ['atan', 1, 2],
        expected: Math.atan2(1, 2),
      },
      {
        name: 'sqrt',
        type: NumberType,
        expression: ['sqrt', ['get', 'number']],
        context: {
          properties: {number: 42},
        },
        expected: Math.sqrt(42),
      },
      {
        name: 'case (first condition)',
        type: StringType,
        expression: [
          'case',
          ['<', ['get', 'value'], 42],
          'small',
          ['<', ['get', 'value'], 100],
          'big',
          'bigger',
        ],
        context: {
          properties: {value: 40},
        },
        expected: 'small',
      },
      {
        name: 'case (second condition)',
        type: StringType,
        expression: [
          'case',
          ['<', ['get', 'value'], 42],
          'small',
          ['<', ['get', 'value'], 100],
          'big',
          'bigger',
        ],
        context: {
          properties: {value: 50},
        },
        expected: 'big',
      },
      {
        name: 'case (fallback)',
        type: StringType,
        expression: [
          'case',
          ['<', ['get', 'value'], 42],
          'small',
          ['<', ['get', 'value'], 100],
          'big',
          'biggest',
        ],
        context: {
          properties: {value: 200},
        },
        expected: 'biggest',
      },
      {
        name: 'match (string match)',
        type: StringType,
        expression: ['match', ['get', 'string'], 'foo', 'got foo', 'got other'],
        context: {
          properties: {string: 'foo'},
        },
        expected: 'got foo',
      },
      {
        name: 'match (string fallback)',
        type: StringType,
        expression: ['match', ['get', 'string'], 'foo', 'got foo', 'got other'],
        context: {
          properties: {string: 'bar'},
        },
        expected: 'got other',
      },
      {
        name: 'match (number match)',
        type: StringType,
        expression: ['match', ['get', 'number'], 42, 'got 42', 'got other'],
        context: {
          properties: {number: 42},
        },
        expected: 'got 42',
      },
      {
        name: 'match (number fallback)',
        type: StringType,
        expression: ['match', ['get', 'number'], 42, 'got 42', 'got other'],
        context: {
          properties: {number: 43},
        },
        expected: 'got other',
      },
      {
        name: 'match (input equals fallback value)',
        type: NumberType,
        expression: ['match', ['get', 'number'], 0, 1, 42],
        context: {
          properties: {number: 42},
        },
        expected: 42,
      },
      {
        name: 'interpolate (linear number)',
        type: NumberType,
        expression: [
          'interpolate',
          ['linear'],
          ['get', 'number'],
          0,
          0,
          1,
          100,
        ],
        context: {
          properties: {number: 0.5},
        },
        expected: 50,
      },
      {
        name: 'interpolate (exponential base 2 number)',
        type: NumberType,
        expression: ['interpolate', ['exponential', 2], 0.5, 0, 0, 1, 100],
        expected: 41.42135623730952,
        tolerance: 1e-6,
      },
      {
        name: 'interpolate (linear no delta)',
        type: NumberType,
        expression: ['interpolate', ['linear'], 42, 42, 1, 42, 2],
        expected: 1,
      },
      {
        name: 'to-string (string)',
        type: StringType,
        expression: ['to-string', 'foo'],
        expected: 'foo',
      },
      {
        name: 'to-string (number)',
        type: StringType,
        expression: ['to-string', 42.9],
        expected: '42.9',
      },
      {
        name: 'to-string (boolean)',
        type: StringType,
        expression: ['to-string', 1 < 2],
        expected: 'true',
      },
      {
        name: 'to-string (array)',
        type: StringType,
        expression: ['to-string', ['get', 'fill']],
        context: {
          properties: {fill: [0, 255, 0]},
        },
        expected: '0,255,0',
      },
      {
        name: 'in (true)',
        type: BooleanType,
        expression: ['in', 3, [1, 2, 3]],
        expected: true,
      },
      {
        name: 'in (false)',
        type: BooleanType,
        expression: ['in', 'yellow', ['literal', ['red', 'green', 'blue']]],
        expected: false,
      },
      {
        name: 'between (true)',
        type: BooleanType,
        expression: ['between', 3, 3, 5],
        expected: true,
      },
      {
        name: 'between (false)',
        type: BooleanType,
        expression: ['between', 3, 4, 5],
        expected: false,
      },
      {
        name: 'has (true)',
        context: {
          properties: {
            property: 42,
          },
        },
        type: BooleanType,
        expression: ['has', 'property'],
        expected: true,
      },
      {
        name: 'has (false)',
        context: {
          properties: {
            property: 42,
          },
        },
        type: BooleanType,
        expression: ['has', 'notProperty'],
        expected: false,
      },
      {
        name: 'has (true - null)',
        context: {
          properties: {
            property: null,
          },
        },
        type: BooleanType,
        expression: ['has', 'property'],
        expected: true,
      },
      {
        name: 'has (true - undefined)',
        context: {
          properties: {
            property: undefined,
          },
        },
        type: BooleanType,
        expression: ['has', 'property'],
        expected: true,
      },
      {
        name: 'has (nested object true)',
        context: {
          properties: {
            deeply: {nested: {property: true}},
          },
        },
        type: BooleanType,
        expression: ['has', 'deeply', 'nested', 'property'],
        expected: true,
      },
      {
        name: 'has (nested object false)',
        context: {
          properties: {
            deeply: {nested: {property: true}},
          },
        },
        type: BooleanType,
        expression: ['has', 'deeply', 'not', 'property'],
        expected: false,
      },
      {
        name: 'has (nested array true)',
        context: {
          properties: {
            property: [42, {foo: 'bar'}],
          },
        },
        type: BooleanType,
        expression: ['has', 'property', 1, 'foo'],
        expected: true,
      },
      {
        name: 'has (nested array false)',
        context: {
          properties: {
            property: [42, {foo: 'bar'}],
          },
        },
        type: BooleanType,
        expression: ['has', 'property', 0, 'foo'],
        expected: false,
      },
    ];

    for (const c of cases) {
      it(`works for ${c.name}`, () => {
        const parsingContext = newParsingContext();
        const evaluator = buildExpression(c.expression, c.type, parsingContext);
        const evaluationContext = c.context || newEvaluationContext();
        const value = evaluator(evaluationContext);
        if (c.tolerance !== undefined) {
          expect(value).to.roughlyEqual(c.expected, c.tolerance);
        } else {
          expect(value).to.eql(c.expected);
        }
      });
    }
  });

  describe('interpolate expressions', () => {
    /**
     * @typedef {Object} InterpolateTest
     * @property {Array} method The interpolation method.
     * @property {Array} stops The stops.
     * @property {Array<Array>} cases The test cases.
     */

    /**
     * @type {Array<InterpolateTest>}
     */
    const tests = [
      {
        method: ['linear'],
        stops: [-1, -1, 0, 0, 1, 100, 2, 1000],
        cases: [
          [-2, -1],
          [-1, -1],
          [-0.5, -0.5],
          [0, 0],
          [0.25, 25],
          [0.5, 50],
          [0.9, 90],
          [1, 100],
          [1.5, 550],
          [2, 1000],
          [3, 1000],
        ],
      },
      {
        method: ['exponential', 2],
        stops: [0, 0, 1, 100],
        cases: [
          [-1, 0],
          [0, 0],
          [0.25, 18.920711500272102],
          [0.5, 41.42135623730952],
          [0.9, 86.60659830736148],
          [1, 100],
          [1.5, 100],
        ],
      },
      {
        method: ['exponential', 3],
        stops: [0, 0, 1, 100],
        cases: [
          [-1, 0],
          [0, 0],
          [0.25, 15.80370064762462],
          [0.5, 36.60254037844386],
          [0.9, 84.39376897611433],
          [1, 100],
          [1.5, 100],
        ],
      },
    ];

    for (const t of tests) {
      const expression = [
        'interpolate',
        t.method,
        ['var', 'input'],
        ...t.stops,
      ];
      const type = typeof t.stops[1] === 'number' ? NumberType : ColorType;
      describe(JSON.stringify(expression), () => {
        const parsingContext = newParsingContext();
        const evaluator = buildExpression(expression, type, parsingContext);
        const evaluationContext = newEvaluationContext();
        for (const [input, output] of t.cases) {
          it(`works for ${input}`, () => {
            evaluationContext.variables.input = input;
            const got = evaluator(evaluationContext);
            expect(got).to.roughlyEqual(output, 1e-6);
          });
        }
      });
    }
  });
});
