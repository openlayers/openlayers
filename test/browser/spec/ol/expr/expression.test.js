import {assert} from 'chai';
import {
  AnyType,
  BooleanType,
  CallExpression,
  ColorType,
  includesType,
  isType,
  LiteralExpression,
  newParsingContext,
  NumberType,
  parse,
  typeName,
} from '../../../../../src/ol/expr/expression.js';

describe('ol/expr/expression.js', () => {
  describe('parse()', () => {
    it('parses a literal color (string)', () => {
      const expression = parse('fuchsia', ColorType, newParsingContext());
      assert.instanceOf(expression, LiteralExpression);
      assert.ok(includesType(expression.type, ColorType));
      assert.deepEqual(expression.value, [255, 0, 255, 1]);
    });

    it('parses a * expression with colors', () => {
      const context = newParsingContext();
      const expression = parse(
        ['*', ['get', 'foo'], 'red', [255, 0, 0, 1]],
        ColorType,
        context,
      );
      assert.instanceOf(expression, CallExpression);
      assert.strictEqual(expression.operator, '*');
      assert.strictEqual(isType(expression.type, ColorType), true);
      assert.lengthOf(expression.args, 3);
      assert.strictEqual(isType(expression.args[0].type, ColorType), true);
      assert.strictEqual(isType(expression.args[1].type, ColorType), true);
      assert.strictEqual(isType(expression.args[2].type, ColorType), true);
    });

    describe('case operation', () => {
      it('respects the return type (string or array color)', () => {
        const context = newParsingContext();
        const expression = parse(
          [
            'case',
            ['>', ['get', 'attr'], 3],
            'red',
            ['>', ['get', 'attr'], 1],
            'yellow',
            [255, 0, 0],
          ],
          ColorType,
          context,
        );
        assert.instanceOf(expression, CallExpression);
        assert.strictEqual(expression.operator, 'case');
        assert.strictEqual(isType(expression.type, ColorType), true);
        assert.lengthOf(expression.args, 5);
        assert.strictEqual(isType(expression.args[0].type, BooleanType), true);
        assert.strictEqual(isType(expression.args[1].type, ColorType), true);
        assert.strictEqual(isType(expression.args[2].type, BooleanType), true);
        assert.strictEqual(isType(expression.args[3].type, ColorType), true);
        assert.strictEqual(isType(expression.args[4].type, ColorType), true);
      });

      it('respects the return type (string color)', () => {
        const expression = parse(
          ['case', true, 'red', false, 'yellow', 'white'],
          ColorType,
          newParsingContext(),
        );
        assert.strictEqual(isType(expression.type, ColorType), true);
      });
    });

    describe('match operation', () => {
      it('respects the return type (color)', () => {
        const context = newParsingContext();
        const expression = parse(
          ['match', ['get', 'attr'], 0, 'red', 1, 'yellow', [255, 0, 0, 1]],
          ColorType,
          context,
        );
        assert.instanceOf(expression, CallExpression);
        assert.strictEqual(expression.operator, 'match');
        assert.strictEqual(isType(expression.type, ColorType), true);
        assert.lengthOf(expression.args, 6);
        assert.strictEqual(
          typeName(expression.args[0].type),
          typeName(NumberType),
        );
        assert.strictEqual(isType(expression.args[1].type, NumberType), true);
        assert.strictEqual(isType(expression.args[2].type, ColorType), true);
        assert.strictEqual(isType(expression.args[3].type, NumberType), true);
        assert.strictEqual(isType(expression.args[4].type, ColorType), true);
        assert.strictEqual(isType(expression.args[5].type, ColorType), true);
      });

      it('respects the return type (color string)', () => {
        const expression = parse(
          ['match', ['get', 'attr'], 0, 'red', 1, 'yellow', 'green'],
          ColorType,
          newParsingContext(),
        );
        assert.strictEqual(isType(expression.type, ColorType), true);
      });
    });

    describe('palette operator', () => {
      it('outputs color type and list of colors as args', () => {
        const expression = parse(
          ['palette', 1, ['red', 'rgba(255, 255, 0, 1)', [0, 255, 255]]],
          ColorType,
          newParsingContext(),
        );
        assert.strictEqual(expression.operator, 'palette');
        assert.strictEqual(isType(expression.type, ColorType), true);
        assert.lengthOf(expression.args, 4);
        assert.strictEqual(isType(expression.args[0].type, NumberType), true);
        assert.strictEqual(isType(expression.args[1].type, ColorType), true);
        assert.strictEqual(isType(expression.args[2].type, ColorType), true);
        assert.strictEqual(isType(expression.args[3].type, ColorType), true);
      });
    });
  });

  describe('parse() errors', () => {
    /**
     * @typedef {Object} Case
     * @property {string} name The case name.
     * @property {Array<*>} expression The expression to parse.
     * @property {import('../../../../src/ol/expr/expression.js').ParsingContext} [context] The parsing context.
     * @property {RegExp} error The expected error message.
     */

    /**
     * @type {Array<Case>}
     */
    const cases = [
      {
        name: 'second argument is not an array of colors (palette)',
        expression: ['palette', ['band', 2], ['red', 'green', 'abcd']],
        error:
          'failed to parse color at index 2 in palette expression: failed to parse "abcd" as color',
      },
    ];

    for (const {name, expression, error, context} of cases) {
      it(`throws for ${name}`, () => {
        const newContext = {...newParsingContext(), ...context};
        assert.throws(() => parse(expression, AnyType, newContext), error);
      });
    }
  });
});
