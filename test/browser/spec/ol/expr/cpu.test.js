import {
  buildExpression,
  newEvaluationContext,
} from '../../../../../src/ol/expr/cpu.js';
import {
  ColorType,
  newParsingContext,
} from '../../../../../src/ol/expr/expression.js';

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
        name: 'interpolate (linear color)',
        type: ColorType,
        expression: ['interpolate', ['linear'], 0.5, 0, 'red', 1, [0, 255, 0]],
        expected: [209, 169, 0, 1],
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
});
