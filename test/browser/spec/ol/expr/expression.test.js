import {
  AnyType,
  BooleanType,
  CallExpression,
  ColorType,
  LiteralExpression,
  NumberType,
  StringType,
  includesType,
  isType,
  newParsingContext,
  parse,
  typeName,
} from '../../../../../src/ol/expr/expression.js';

describe('ol/expr/expression.js', () => {
  describe('parse()', () => {
    it('parses a literal color (string)', () => {
      const expression = parse('fuchsia', ColorType, newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(includesType(expression.type, ColorType));
      expect(expression.value).to.eql([255, 0, 255, 1]);
    });

    it('parses a * expression with colors', () => {
      const context = newParsingContext();
      const expression = parse(
        ['*', ['get', 'foo'], 'red', [255, 0, 0, 1]],
        ColorType,
        context,
      );
      expect(expression).to.be.a(CallExpression);
      expect(expression.operator).to.be('*');
      expect(isType(expression.type, ColorType)).to.be(true);
      expect(expression.args).to.have.length(3);
      expect(isType(expression.args[0].type, ColorType)).to.be(true);
      expect(isType(expression.args[1].type, ColorType)).to.be(true);
      expect(isType(expression.args[2].type, ColorType)).to.be(true);
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
        expect(expression).to.be.a(CallExpression);
        expect(expression.operator).to.be('case');
        expect(isType(expression.type, ColorType)).to.be(true);
        expect(expression.args).to.have.length(5);
        expect(isType(expression.args[0].type, BooleanType)).to.be(true);
        expect(isType(expression.args[1].type, ColorType)).to.be(true);
        expect(isType(expression.args[2].type, BooleanType)).to.be(true);
        expect(isType(expression.args[3].type, ColorType)).to.be(true);
        expect(isType(expression.args[4].type, ColorType)).to.be(true);
      });

      it('respects the return type (string color)', () => {
        const expression = parse(
          ['case', true, 'red', false, 'yellow', 'white'],
          ColorType,
          newParsingContext(),
        );
        expect(isType(expression.type, ColorType)).to.be(true);
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
        expect(expression).to.be.a(CallExpression);
        expect(expression.operator).to.be('match');
        expect(isType(expression.type, ColorType)).to.be(true);
        expect(expression.args).to.have.length(6);
        expect(typeName(expression.args[0].type)).to.be(
          typeName(BooleanType | StringType | NumberType),
        );
        expect(isType(expression.args[1].type, NumberType)).to.be(true);
        expect(isType(expression.args[2].type, ColorType)).to.be(true);
        expect(isType(expression.args[3].type, NumberType)).to.be(true);
        expect(isType(expression.args[4].type, ColorType)).to.be(true);
        expect(isType(expression.args[5].type, ColorType)).to.be(true);
      });

      it('respects the return type (color string)', () => {
        const expression = parse(
          ['match', ['get', 'attr'], 0, 'red', 1, 'yellow', 'green'],
          ColorType,
          newParsingContext(),
        );
        expect(isType(expression.type, ColorType)).to.be(true);
      });
    });

    describe('palette operator', () => {
      it('outputs color type and list of colors as args', () => {
        const expression = parse(
          ['palette', 1, ['red', 'rgba(255, 255, 0, 1)', [0, 255, 255]]],
          ColorType,
          newParsingContext(),
        );
        expect(expression.operator).to.be('palette');
        expect(isType(expression.type, ColorType)).to.be(true);
        expect(expression.args).to.have.length(4);
        expect(isType(expression.args[0].type, NumberType)).to.be(true);
        expect(isType(expression.args[1].type, ColorType)).to.be(true);
        expect(isType(expression.args[2].type, ColorType)).to.be(true);
        expect(isType(expression.args[3].type, ColorType)).to.be(true);
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
        expect(() => parse(expression, AnyType, newContext)).to.throwError(
          (e) => expect(e.message).to.eql(error),
        );
      });
    }
  });
});
