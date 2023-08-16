import expect from '../../expect.js';
import {
  BooleanType,
  NumberType,
  StringType,
  newParsingContext,
} from '../../../../src/ol/expr/expression.js';
import {
  buildExpression,
  newEvaluationContext,
} from '../../../../src/ol/expr/cpu.js';

describe('ol/expr/cpu.js', () => {
  describe('buildExpression()', () => {
    /**
     * @typedef {Object} Case
     * @property {string} name The case name.
     * @property {import('../../../../src/ol/expr/expression.js').EncodedExpression} expression The encoded expression.
     * @property {import('../../../../src/ol/expr/cpu.js').EvaluationContext} [context] The evaluation context.
     * @property {number} type The expression type.
     * @property {import('../../../../src/ol/expr/expression.js').LiteralValue} expected The expected value.
     */

    /**
     * @type {Array<Case>}
     */
    const cases = [
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
    ];

    for (const c of cases) {
      it(`works for ${c.name}`, () => {
        const parsingContext = newParsingContext();
        const evaluator = buildExpression(c.expression, c.type, parsingContext);
        const evaluationContext = c.context || newEvaluationContext();
        const value = evaluator(evaluationContext);
        expect(value).to.eql(c.expected);
      });
    }
  });
});
