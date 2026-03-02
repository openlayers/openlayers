import {
  AnyType,
  BooleanType,
  CallExpression,
  ColorType,
  LiteralExpression,
  NoneType,
  NumberArrayType,
  NumberType,
  SizeType,
  StringType,
  computeGeometryType,
  includesType,
  isType,
  newParsingContext,
  parse,
  typeName,
} from '../../../../src/ol/expr/expression.js';
import Circle from '../../../../src/ol/geom/Circle.js';
import GeometryCollection from '../../../../src/ol/geom/GeometryCollection.js';
import MultiLineString from '../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../src/ol/geom/Point.js';
import expect from '../../expect.js';

describe('ol/expr/expression.js', () => {
  describe('parse()', () => {
    it('parses a literal boolean', () => {
      const expression = parse(true, BooleanType, newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(isType(expression.type, BooleanType)).to.be(true);
      expect(expression.value).to.be(true);
    });

    it('casts a number to boolean (42)', () => {
      const expression = parse(42, BooleanType, newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(typeName(expression.type)).to.be(typeName(BooleanType));
      expect(expression.value).to.be(true);
    });

    it('casts a number to boolean (0)', () => {
      const expression = parse(0, BooleanType, newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(typeName(expression.type)).to.be(typeName(BooleanType));
      expect(expression.value).to.be(false);
    });

    it('casts a string to boolean ("foo")', () => {
      const expression = parse('foo', BooleanType, newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(typeName(expression.type)).to.be(typeName(BooleanType));
      expect(expression.value).to.be(true);
    });

    it('casts a string to boolean ("")', () => {
      const expression = parse('', BooleanType, newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(typeName(expression.type)).to.be(typeName(BooleanType));
      expect(expression.value).to.be(false);
    });

    it('parses a literal string', () => {
      const expression = parse('foo', StringType, newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(isType(expression.type, StringType)).to.be(true);
      expect(expression.value).to.be('foo');
    });

    it('casts a number to a string', () => {
      const expression = parse(42, StringType, newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(isType(expression.type, StringType)).to.be(true);
      expect(expression.value).to.be('42');
    });

    it('casts a boolean to a string (true)', () => {
      const expression = parse(true, StringType, newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(typeName(expression.type)).to.be(typeName(StringType));
      expect(expression.value).to.be('true');
    });

    it('casts a boolean to a string (false)', () => {
      const expression = parse(false, StringType, newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(typeName(expression.type)).to.be(typeName(StringType));
      expect(expression.value).to.be('false');
    });

    it('parses a literal number', () => {
      const expression = parse(42, NumberType, newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(isType(expression.type, NumberType)).to.be(true);
      expect(expression.value).to.be(42);
    });

    it('parses a literal color (array)', () => {
      const expression = parse([255, 0, 255], ColorType, newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(includesType(expression.type, ColorType));
      expect(expression.value).to.eql([255, 0, 255, 1]);
    });

    it('parses a literal color (array w/ alpha)', () => {
      const expression = parse([0, 0, 0, 1], ColorType, newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(includesType(expression.type, ColorType));
      expect(expression.value).to.eql([0, 0, 0, 1]);
    });

    it('parses a literal number array', () => {
      const expression = parse([10, 20], NumberArrayType, newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(includesType(expression.type, NumberArrayType));
      expect(expression.value).to.eql([10, 20]);
    });

    it('parses a get expression', () => {
      const context = newParsingContext();
      const expression = parse(['get', 'foo'], AnyType, context);
      expect(expression).to.be.a(CallExpression);
      expect(expression.operator).to.be('get');
      expect(isType(expression.type, AnyType)).to.be(true);
      expect(context.properties.has('foo')).to.be(true);
    });

    it('parses a var expression', () => {
      const context = newParsingContext();
      const expression = parse(['var', 'foo'], AnyType, context);
      expect(expression).to.be.a(CallExpression);
      expect(expression.operator).to.be('var');
      expect(isType(expression.type, AnyType)).to.be(true);
      expect(context.variables.has('foo')).to.be(true);
    });

    it('parses an expression relying on map state', () => {
      let context = newParsingContext();
      parse(['zoom'], NumberType, context);
      expect(context.mapState).to.be(true);

      context = newParsingContext();
      parse(['resolution'], NumberType, context);
      expect(context.mapState).to.be(true);

      context = newParsingContext();
      parse(['time'], NumberType, context);
      expect(context.mapState).to.be(true);
    });

    it('parses a concat expression', () => {
      const context = newParsingContext();
      const expression = parse(
        ['concat', ['get', 'foo'], ' ', 'random'],
        StringType,
        context,
      );
      expect(expression).to.be.a(CallExpression);
      expect(expression.operator).to.be('concat');
      expect(isType(expression.type, StringType));
      expect(context.properties.has('foo')).to.be(true);
    });

    it('is ok to have a concat expression with a string and number', () => {
      const context = newParsingContext();
      const expression = parse(
        ['concat', 'the answer is ', 42],
        StringType,
        context,
      );
      expect(expression).to.be.a(CallExpression);
      expect(expression.operator).to.be('concat');
      expect(typeName(expression.type)).to.be(typeName(StringType));
      expect(expression.args).to.have.length(2);
      expect(typeName(expression.args[0].type)).to.be(typeName(StringType));
      expect(typeName(expression.args[1].type)).to.be(typeName(StringType));
    });

    it('parses a coalesce expression', () => {
      const context = newParsingContext();
      const expression = parse(
        ['coalesce', ['get', 'foo'], 'default'],
        StringType,
        context,
      );
      expect(expression).to.be.a(CallExpression);
      expect(expression.operator).to.be('coalesce');
      expect(isType(expression.type, StringType));
      expect(context.properties.has('foo')).to.be(true);
    });

    it('parses id expression', () => {
      const context = newParsingContext();
      const expression = parse(['id'], StringType | NumberType, context);
      expect(context.featureId).to.be(true);

      expect(expression).to.be.a(CallExpression);
      expect(expression.operator).to.be('id');
      expect(isType(expression.type, StringType | NumberType));
    });

    it('parses a == expression', () => {
      const context = newParsingContext();
      const expression = parse(
        ['==', ['get', 'foo'], 'bar'],
        BooleanType,
        context,
      );
      expect(expression).to.be.a(CallExpression);
      expect(expression.operator).to.be('==');
      expect(isType(expression.type, BooleanType)).to.be(true);
      expect(expression.args).to.have.length(2);
      expect(expression.args[0]).to.be.a(CallExpression);
      expect(isType(expression.args[0].type, AnyType)).to.be(true);
      expect(expression.args[1]).to.be.a(LiteralExpression);
      expect(isType(expression.args[1].type, StringType)).to.be(true);
      expect(context.properties.has('foo')).to.be(true);
    });

    describe('case operation', () => {
      it('respects the return type (string)', () => {
        const expression = parse(
          ['case', true, 'red', false, 'yellow', '42'],
          StringType,
          newParsingContext(),
        );
        expect(isType(expression.type, StringType)).to.be(true);
      });

      it('respects the return type (number array)', () => {
        const expression = parse(
          [
            'case',
            true,
            [255, 0, 0],
            false,
            [255, 255, 0],
            false,
            [255, 255, 255],
            [255, 0, 255],
          ],
          NumberArrayType,
          newParsingContext(),
        );
        expect(isType(expression.type, NumberArrayType)).to.be(true);
        expect(isType(expression.args[1].type, NumberArrayType)).to.be(true);
        expect(isType(expression.args[3].type, NumberArrayType)).to.be(true);
        expect(isType(expression.args[5].type, NumberArrayType)).to.be(true);
        expect(isType(expression.args[6].type, NumberArrayType)).to.be(true);
      });

      it('respects the return type (size)', () => {
        const expression = parse(
          [
            'case',
            ['==', ['get', 'A'], 'true'],
            1,
            ['==', ['get', 'B'], 'true'],
            2,
            3,
          ],
          SizeType,
          newParsingContext(),
        );
        expect(isType(expression.type, SizeType)).to.be(true);
        expect(isType(expression.args[1].type, SizeType)).to.be(true);
        expect(isType(expression.args[3].type, SizeType)).to.be(true);
        expect(isType(expression.args[4].type, SizeType)).to.be(true);
      });
    });

    describe('match operation', () => {
      it('respects the return type (string)', () => {
        const expression = parse(
          ['match', ['get', 'attr'], 0, 'red', 1, 'yellow', 'not_a_color'],
          StringType,
          newParsingContext(),
        );
        expect(isType(expression.type, StringType)).to.be(true);
      });

      it('respects the return type (color array)', () => {
        const expression = parse(
          ['match', ['get', 'attr'], 0, [1, 1, 0], 1, [1, 0, 1], [0, 1, 1]],
          ColorType,
          newParsingContext(),
        );
        expect(isType(expression.type, ColorType)).to.be(true);
      });

      it('respects the return type (size)', () => {
        const expression = parse(
          ['match', ['get', 'shape'], 'light', 0.5, 0.7],
          SizeType,
          newParsingContext(),
        );
        expect(isType(expression.type, SizeType)).to.be(true);
      });
    });

    describe('in operation', () => {
      it('respects the return type (number haystack)', () => {
        const context = newParsingContext();
        const expression = parse(
          ['in', ['get', 'attr'], [0, 50, 100]],
          BooleanType,
          context,
        );
        expect(expression).to.be.a(CallExpression);
        expect(expression.operator).to.be('in');
        expect(isType(expression.type, BooleanType)).to.be(true);
        expect(expression.args).to.have.length(4);
        expect(isType(expression.args[0].type, NumberType)).to.be(true);
        expect(isType(expression.args[1].type, NumberType)).to.be(true);
        expect(isType(expression.args[2].type, NumberType)).to.be(true);
        expect(isType(expression.args[3].type, NumberType)).to.be(true);
      });

      it('respects the return type (number haystack using literal operator)', () => {
        const context = newParsingContext();
        const expression = parse(
          ['in', ['get', 'attr'], ['literal', [0, 50, 100]]],
          BooleanType,
          context,
        );
        expect(expression).to.be.a(CallExpression);
        expect(expression.operator).to.be('in');
        expect(isType(expression.type, BooleanType)).to.be(true);
        expect(expression.args).to.have.length(4);
        expect(isType(expression.args[0].type, NumberType)).to.be(true);
        expect(isType(expression.args[1].type, NumberType)).to.be(true);
        expect(isType(expression.args[2].type, NumberType)).to.be(true);
        expect(isType(expression.args[3].type, NumberType)).to.be(true);
      });

      it('respects the return types (string haystack)', () => {
        const context = newParsingContext();
        const expression = parse(
          ['in', ['get', 'attr'], ['literal', ['ab', 'cd', 'ef', 'gh']]],
          BooleanType,
          context,
        );
        expect(expression).to.be.a(CallExpression);
        expect(expression.operator).to.be('in');
        expect(isType(expression.type, BooleanType)).to.be(true);
        expect(expression.args).to.have.length(5);
        expect(isType(expression.args[0].type, StringType)).to.be(true);
        expect(isType(expression.args[1].type, StringType)).to.be(true);
        expect(isType(expression.args[2].type, StringType)).to.be(true);
        expect(isType(expression.args[3].type, StringType)).to.be(true);
        expect(isType(expression.args[4].type, StringType)).to.be(true);
      });
    });

    describe('array operator', () => {
      it('respects the return type (number array)', () => {
        const expression = parse(
          ['array', 1, 2, ['get', 'third'], 4, 5],
          NumberArrayType,
          newParsingContext(),
        );
        expect(expression.operator).to.be('array');
        expect(isType(expression.type, NumberArrayType)).to.be(true);
        expect(expression.args).to.have.length(5);
        expect(isType(expression.args[0].type, NumberType)).to.be(true);
        expect(isType(expression.args[1].type, NumberType)).to.be(true);
        expect(isType(expression.args[2].type, NumberType)).to.be(true);
        expect(isType(expression.args[3].type, NumberType)).to.be(true);
        expect(isType(expression.args[4].type, NumberType)).to.be(true);
      });

      it('respects the return type (color)', () => {
        const expression = parse(
          ['array', 1, 2, ['get', 'blue']],
          ColorType,
          newParsingContext(),
        );
        expect(isType(expression.type, ColorType)).to.be(true);
        expect(expression.args).to.have.length(3);
        expect(isType(expression.args[0].type, NumberType)).to.be(true);
        expect(isType(expression.args[1].type, NumberType)).to.be(true);
        expect(isType(expression.args[2].type, NumberType)).to.be(true);
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
        name: 'interpolate with invalid method',
        expression: ['interpolate', ['invalid'], 0.5, 0, 0, 1, 1],
        error: 'invalid interpolation type: ["invalid"]',
      },
      {
        name: 'interpolate with missing stop output',
        expression: ['interpolate', ['linear'], 0.5, 0, 0, 1, 1, 2, 2, 3],
        error:
          'expected an even number of arguments for operation interpolate, got 9 instead',
      },
      {
        name: 'interpolate with string input',
        expression: ['interpolate', ['linear'], 'oops', 0, 0, 1, 1],
        error:
          'failed to parse argument 1 in interpolate expression: got a string, but expected number',
      },
      {
        name: 'interpolate with string stop input',
        expression: ['interpolate', ['linear'], 0.5, 0, 0, 1, 1, 'x', 2, 3, 3],
        error:
          'failed to parse argument 6 for interpolate expression: got a string, but expected number',
      },
      {
        name: 'interpolate with string base',
        expression: ['interpolate', ['exponential', 'x'], 0.5, 0, 0, 1, 1],
        error:
          'expected a number base for exponential interpolation, got "x" instead',
      },
      {
        name: 'invalid expression',
        expression: null,
        error: 'expression must be an array or a primitive value',
      },
      {
        name: 'invalid argument count (case)',
        expression: ['case', true, 0, false, 1],
        error: 'expected an odd number of arguments for case, got 4 instead',
      },
      {
        name: 'no common output type could be found (case)',
        expression: ['case', true, 'red', false, '42', 123],
        error:
          'failed to parse argument 1 of case expression: got a string, but expected number',
      },
      {
        name: 'mismatched types (match number and string)',
        expression: ['match', ['get', 'attr'], 0, 'red', 1, 123, 456],
        error:
          'failed to parse argument 2 of match expression: got a string, but expected number',
      },
      {
        name: 'mismatched types in array (in)',
        expression: ['in', ['get', 'attr'], [0, 'abc', 50]],
        error:
          'failed to parse haystack item 1 for "in" expression: got a string, but expected number',
      },
      {
        name: 'invalid argument count (in)',
        expression: ['in', ['get', 'attr'], 'abcd', 'efgh'],
        error: 'expected 2 arguments for in, got 3',
      },
      {
        name: 'second argument is not an array (in)',
        expression: ['in', ['get', 'attr'], 'abcd'],
        error: 'the second argument for the "in" operator must be an array',
      },
      {
        name: 'second argument is a string array but not wrapped in a literal operator (in)',
        expression: ['in', ['get', 'attr'], ['abcd', 'efgh', 'ijkl']],
        error:
          'for the "in" operator, a string array should be wrapped in a "literal" operator to disambiguate from expressions',
      },
      {
        name: 'second argument is a literal value but not an array (in)',
        expression: ['in', ['get', 'attr'], ['literal', 123]],
        error:
          'failed to parse "in" expression: the literal operator must be followed by an array',
      },
      {
        name: 'first argument is not a number (palette)',
        expression: ['palette', 'abc', ['red', 'green', 'blue']],
        error:
          'failed to parse first argument in palette expression: got a string, but expected number',
      },
      {
        name: 'second argument is not an array (palette)',
        expression: ['palette', ['band', 2], 'red'],
        error: 'the second argument of palette must be an array',
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

  describe('typeName()', () => {
    const cases = [
      {type: BooleanType, name: 'boolean'},
      {type: StringType, name: 'string'},
      {type: NumberType, name: 'number'},
      {type: ColorType, name: 'color'},
      {type: NumberArrayType, name: 'number[]'},
      {type: BooleanType | StringType, name: 'boolean or string'},
      {
        type: BooleanType | NumberType | StringType,
        name: 'boolean, number, or string',
      },
      {
        type: BooleanType | NumberType | StringType | ColorType,
        name: 'boolean, number, string, or color',
      },
      {
        type: AnyType,
        name: 'boolean, number, string, color, number[], or size',
      },
    ];

    for (const {type, name} of cases) {
      it(`returns ${name} for ${type}`, () => {
        expect(typeName(type)).to.be(name);
      });
    }
  });

  describe('includesType()', () => {
    it('works for BooleanType', () => {
      expect(includesType(NoneType, BooleanType)).to.be(false);
      expect(includesType(BooleanType, BooleanType)).to.be(true);
      expect(includesType(StringType, BooleanType)).to.be(false);
      expect(includesType(NumberType, BooleanType)).to.be(false);
      expect(includesType(ColorType, BooleanType)).to.be(false);
      expect(includesType(NumberArrayType, BooleanType)).to.be(false);
      expect(includesType(AnyType, BooleanType)).to.be(true);
    });

    it('works for StringType', () => {
      expect(includesType(NoneType, StringType)).to.be(false);
      expect(includesType(BooleanType, StringType)).to.be(false);
      expect(includesType(StringType, StringType)).to.be(true);
      expect(includesType(NumberType, StringType)).to.be(false);
      expect(includesType(ColorType, StringType)).to.be(false);
      expect(includesType(NumberArrayType, StringType)).to.be(false);
      expect(includesType(AnyType, StringType)).to.be(true);
    });

    it('works for NumberType', () => {
      expect(includesType(NoneType, NumberType)).to.be(false);
      expect(includesType(BooleanType, NumberType)).to.be(false);
      expect(includesType(StringType, NumberType)).to.be(false);
      expect(includesType(NumberType, NumberType)).to.be(true);
      expect(includesType(ColorType, NumberType)).to.be(false);
      expect(includesType(NumberArrayType, NumberType)).to.be(false);
      expect(includesType(AnyType, NumberType)).to.be(true);
    });

    it('works for ColorType', () => {
      expect(includesType(NoneType, ColorType)).to.be(false);
      expect(includesType(BooleanType, ColorType)).to.be(false);
      expect(includesType(StringType, ColorType)).to.be(false);
      expect(includesType(NumberType, ColorType)).to.be(false);
      expect(includesType(ColorType, ColorType)).to.be(true);
      expect(includesType(NumberArrayType, ColorType)).to.be(false);
      expect(includesType(AnyType, ColorType)).to.be(true);
    });

    it('works for NumberArrayType', () => {
      expect(includesType(NoneType, NumberArrayType)).to.be(false);
      expect(includesType(BooleanType, NumberArrayType)).to.be(false);
      expect(includesType(StringType, NumberArrayType)).to.be(false);
      expect(includesType(NumberType, NumberArrayType)).to.be(false);
      expect(includesType(ColorType, NumberArrayType)).to.be(false);
      expect(includesType(NumberArrayType, NumberArrayType)).to.be(true);
      expect(includesType(AnyType, NumberArrayType)).to.be(true);
    });
  });

  describe('isType()', () => {
    it('works for BooleanType', () => {
      expect(isType(NoneType, BooleanType)).to.be(false);
      expect(isType(BooleanType, BooleanType)).to.be(true);
      expect(isType(StringType, BooleanType)).to.be(false);
      expect(isType(NumberType, BooleanType)).to.be(false);
      expect(isType(ColorType, BooleanType)).to.be(false);
      expect(isType(NumberArrayType, BooleanType)).to.be(false);
      expect(isType(AnyType, BooleanType)).to.be(false);
    });

    it('works for StringType', () => {
      expect(isType(NoneType, StringType)).to.be(false);
      expect(isType(BooleanType, StringType)).to.be(false);
      expect(isType(StringType, StringType)).to.be(true);
      expect(isType(NumberType, StringType)).to.be(false);
      expect(isType(ColorType, StringType)).to.be(false);
      expect(isType(NumberArrayType, StringType)).to.be(false);
      expect(isType(AnyType, StringType)).to.be(false);
    });

    it('works for NumberType', () => {
      expect(isType(NoneType, NumberType)).to.be(false);
      expect(isType(BooleanType, NumberType)).to.be(false);
      expect(isType(StringType, NumberType)).to.be(false);
      expect(isType(NumberType, NumberType)).to.be(true);
      expect(isType(ColorType, NumberType)).to.be(false);
      expect(isType(NumberArrayType, NumberType)).to.be(false);
      expect(isType(AnyType, NumberType)).to.be(false);
    });

    it('works for ColorType', () => {
      expect(isType(NoneType, ColorType)).to.be(false);
      expect(isType(BooleanType, ColorType)).to.be(false);
      expect(isType(StringType, ColorType)).to.be(false);
      expect(isType(NumberType, ColorType)).to.be(false);
      expect(isType(ColorType, ColorType)).to.be(true);
      expect(isType(NumberArrayType, ColorType)).to.be(false);
      expect(isType(AnyType, ColorType)).to.be(false);
    });

    it('works for NumberArrayType', () => {
      expect(isType(NoneType, NumberArrayType)).to.be(false);
      expect(isType(BooleanType, NumberArrayType)).to.be(false);
      expect(isType(StringType, NumberArrayType)).to.be(false);
      expect(isType(NumberType, NumberArrayType)).to.be(false);
      expect(isType(ColorType, NumberArrayType)).to.be(false);
      expect(isType(NumberArrayType, NumberArrayType)).to.be(true);
      expect(isType(AnyType, NumberArrayType)).to.be(false);
    });
  });
  describe('computeGeometryType', () => {
    it('returns empty string for falsy geom', () => {
      expect(computeGeometryType(undefined)).to.eql('');
    });
    it('returns Point for Point geom', () => {
      expect(computeGeometryType(new Point([0, 1]))).to.eql('Point');
    });
    it('returns Polygon for MultiPolygon geom', () => {
      expect(computeGeometryType(new MultiPolygon([]))).to.eql('Polygon');
    });
    it('returns LineString for MultiLineString geom', () => {
      expect(computeGeometryType(new MultiLineString([]))).to.eql('LineString');
    });
    it('returns first geom type in geometry collection', () => {
      expect(
        computeGeometryType(new GeometryCollection([new Circle([0, 1])])),
      ).to.eql('Polygon');
      expect(
        computeGeometryType(new GeometryCollection([new MultiPoint([])])),
      ).to.eql('Point');
    });
    it('returns empty string for empty geom collection', () => {
      expect(computeGeometryType(new GeometryCollection([]))).to.eql('');
    });
  });
});
