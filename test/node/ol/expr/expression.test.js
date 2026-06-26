import {assert} from 'chai';
import {
  AnyType,
  BooleanType,
  CallExpression,
  ColorType,
  computeGeometryType,
  includesType,
  isType,
  LiteralExpression,
  newParsingContext,
  NoneType,
  NumberArrayType,
  NumberType,
  parse,
  SizeType,
  StringType,
  typeName,
} from '../../../../src/ol/expr/expression.js';
import Circle from '../../../../src/ol/geom/Circle.js';
import GeometryCollection from '../../../../src/ol/geom/GeometryCollection.js';
import MultiLineString from '../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../src/ol/geom/Point.js';

describe('ol/expr/expression.js', () => {
  describe('parse()', () => {
    it('parses a literal boolean', () => {
      const expression = parse(true, BooleanType, newParsingContext());
      assert.instanceOf(expression, LiteralExpression);
      assert.strictEqual(isType(expression.type, BooleanType), true);
      assert.strictEqual(expression.value, true);
    });

    it('casts a number to boolean (42)', () => {
      const expression = parse(42, BooleanType, newParsingContext());
      assert.instanceOf(expression, LiteralExpression);
      assert.strictEqual(typeName(expression.type), typeName(BooleanType));
      assert.strictEqual(expression.value, true);
    });

    it('casts a number to boolean (0)', () => {
      const expression = parse(0, BooleanType, newParsingContext());
      assert.instanceOf(expression, LiteralExpression);
      assert.strictEqual(typeName(expression.type), typeName(BooleanType));
      assert.strictEqual(expression.value, false);
    });

    it('casts a string to boolean ("foo")', () => {
      const expression = parse('foo', BooleanType, newParsingContext());
      assert.instanceOf(expression, LiteralExpression);
      assert.strictEqual(typeName(expression.type), typeName(BooleanType));
      assert.strictEqual(expression.value, true);
    });

    it('casts a string to boolean ("")', () => {
      const expression = parse('', BooleanType, newParsingContext());
      assert.instanceOf(expression, LiteralExpression);
      assert.strictEqual(typeName(expression.type), typeName(BooleanType));
      assert.strictEqual(expression.value, false);
    });

    it('parses a literal string', () => {
      const expression = parse('foo', StringType, newParsingContext());
      assert.instanceOf(expression, LiteralExpression);
      assert.strictEqual(isType(expression.type, StringType), true);
      assert.strictEqual(expression.value, 'foo');
    });

    it('casts a number to a string', () => {
      const expression = parse(42, StringType, newParsingContext());
      assert.instanceOf(expression, LiteralExpression);
      assert.strictEqual(isType(expression.type, StringType), true);
      assert.strictEqual(expression.value, '42');
    });

    it('casts a boolean to a string (true)', () => {
      const expression = parse(true, StringType, newParsingContext());
      assert.instanceOf(expression, LiteralExpression);
      assert.strictEqual(typeName(expression.type), typeName(StringType));
      assert.strictEqual(expression.value, 'true');
    });

    it('casts a boolean to a string (false)', () => {
      const expression = parse(false, StringType, newParsingContext());
      assert.instanceOf(expression, LiteralExpression);
      assert.strictEqual(typeName(expression.type), typeName(StringType));
      assert.strictEqual(expression.value, 'false');
    });

    it('parses a literal number', () => {
      const expression = parse(42, NumberType, newParsingContext());
      assert.instanceOf(expression, LiteralExpression);
      assert.strictEqual(isType(expression.type, NumberType), true);
      assert.strictEqual(expression.value, 42);
    });

    it('parses a literal color (array)', () => {
      const expression = parse([255, 0, 255], ColorType, newParsingContext());
      assert.instanceOf(expression, LiteralExpression);
      assert.ok(includesType(expression.type, ColorType));
      assert.deepEqual(expression.value, [255, 0, 255, 1]);
    });

    it('parses a literal color (array w/ alpha)', () => {
      const expression = parse([0, 0, 0, 1], ColorType, newParsingContext());
      assert.instanceOf(expression, LiteralExpression);
      assert.ok(includesType(expression.type, ColorType));
      assert.deepEqual(expression.value, [0, 0, 0, 1]);
    });

    it('parses a literal number array', () => {
      const expression = parse([10, 20], NumberArrayType, newParsingContext());
      assert.instanceOf(expression, LiteralExpression);
      assert.ok(includesType(expression.type, NumberArrayType));
      assert.deepEqual(expression.value, [10, 20]);
    });

    it('parses a get expression', () => {
      const context = newParsingContext();
      const expression = parse(['get', 'foo'], AnyType, context);
      assert.instanceOf(expression, CallExpression);
      assert.strictEqual(expression.operator, 'get');
      assert.strictEqual(isType(expression.type, AnyType), true);
      assert.strictEqual(context.properties.get('foo'), AnyType);
    });

    it('parses a get expression with a specific type', () => {
      const context = newParsingContext();
      const expression = parse(['get', 'foo'], NumberArrayType, context);
      assert.strictEqual(isType(expression.type, NumberArrayType), true);
      assert.strictEqual(context.properties.get('foo'), NumberArrayType);
    });

    it('parses a var expression', () => {
      const context = newParsingContext();
      const expression = parse(['var', 'foo'], AnyType, context);
      assert.instanceOf(expression, CallExpression);
      assert.strictEqual(expression.operator, 'var');
      assert.strictEqual(isType(expression.type, AnyType), true);
      assert.strictEqual(context.variables.get('foo'), AnyType);
    });

    it('parses an expression relying on map state', () => {
      let context = newParsingContext();
      parse(['zoom'], NumberType, context);
      assert.strictEqual(context.mapState, true);

      context = newParsingContext();
      parse(['resolution'], NumberType, context);
      assert.strictEqual(context.mapState, true);

      context = newParsingContext();
      parse(['time'], NumberType, context);
      assert.strictEqual(context.mapState, true);
    });

    it('parses a concat expression', () => {
      const context = newParsingContext();
      const expression = parse(
        ['concat', ['get', 'foo'], ' ', 'random'],
        StringType,
        context,
      );
      assert.instanceOf(expression, CallExpression);
      assert.strictEqual(expression.operator, 'concat');
      assert.ok(isType(expression.type, StringType));
      assert.strictEqual(context.properties.get('foo'), StringType);
    });

    it('is ok to have a concat expression with a string and number', () => {
      const context = newParsingContext();
      const expression = parse(
        ['concat', 'the answer is ', 42],
        StringType,
        context,
      );
      assert.instanceOf(expression, CallExpression);
      assert.strictEqual(expression.operator, 'concat');
      assert.strictEqual(typeName(expression.type), typeName(StringType));
      assert.lengthOf(expression.args, 2);
      assert.strictEqual(
        typeName(expression.args[0].type),
        typeName(StringType),
      );
      assert.strictEqual(
        typeName(expression.args[1].type),
        typeName(StringType),
      );
    });

    it('parses a coalesce expression', () => {
      const context = newParsingContext();
      const expression = parse(
        ['coalesce', ['get', 'foo'], 'default'],
        StringType,
        context,
      );
      assert.instanceOf(expression, CallExpression);
      assert.strictEqual(expression.operator, 'coalesce');
      assert.ok(isType(expression.type, StringType));
      assert.strictEqual(context.properties.get('foo'), StringType);
    });

    it('parses id expression', () => {
      const context = newParsingContext();
      const expression = parse(['id'], StringType | NumberType, context);
      assert.strictEqual(context.featureId, true);

      assert.instanceOf(expression, CallExpression);
      assert.strictEqual(expression.operator, 'id');
      assert.ok(isType(expression.type, StringType | NumberType));
    });

    it('parses a == expression', () => {
      const context = newParsingContext();
      const expression = parse(
        ['==', ['get', 'foo'], 'bar'],
        BooleanType,
        context,
      );
      assert.instanceOf(expression, CallExpression);
      assert.strictEqual(expression.operator, '==');
      assert.strictEqual(isType(expression.type, BooleanType), true);
      assert.lengthOf(expression.args, 2);
      assert.instanceOf(expression.args[0], CallExpression);
      assert.strictEqual(isType(expression.args[0].type, StringType), true);
      assert.instanceOf(expression.args[1], LiteralExpression);
      assert.strictEqual(isType(expression.args[1].type, StringType), true);
      assert.strictEqual(context.properties.get('foo'), StringType);
    });

    it('narrows down types using provided style variables', () => {
      const styleVariables = {x: 123};
      const context = newParsingContext(styleVariables);
      parse(['==', ['var', 'x'], ['get', 'y']], BooleanType, context);
      assert.strictEqual(context.variables.get('x'), NumberType);
      assert.strictEqual(context.properties.get('y'), NumberType);
    });

    it('do a more lenient type determination for style variables (string as color)', () => {
      const styleVariables = {x: 'hello'};
      const context = newParsingContext(styleVariables);
      parse(['var', 'x'], ColorType, context);
      assert.strictEqual(context.variables.get('x'), ColorType);
    });

    it('do a more lenient type determination for style variables (number[] as size)', () => {
      const styleVariables = {x: [1, 2]};
      const context = newParsingContext(styleVariables);
      parse(['var', 'x'], SizeType, context);
      assert.strictEqual(context.variables.get('x'), SizeType);
    });

    describe('case operation', () => {
      it('respects the return type (string)', () => {
        const expression = parse(
          ['case', true, 'red', false, 'yellow', '42'],
          StringType,
          newParsingContext(),
        );
        assert.strictEqual(isType(expression.type, StringType), true);
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
        assert.strictEqual(isType(expression.type, NumberArrayType), true);
        assert.strictEqual(
          isType(expression.args[1].type, NumberArrayType),
          true,
        );
        assert.strictEqual(
          isType(expression.args[3].type, NumberArrayType),
          true,
        );
        assert.strictEqual(
          isType(expression.args[5].type, NumberArrayType),
          true,
        );
        assert.strictEqual(
          isType(expression.args[6].type, NumberArrayType),
          true,
        );
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
        assert.strictEqual(isType(expression.type, SizeType), true);
        assert.strictEqual(isType(expression.args[1].type, SizeType), true);
        assert.strictEqual(isType(expression.args[3].type, SizeType), true);
        assert.strictEqual(isType(expression.args[4].type, SizeType), true);
      });
    });

    describe('match operation', () => {
      it('respects the return type (string)', () => {
        const context = newParsingContext();
        const expression = parse(
          ['match', ['get', 'attr'], 0, 'red', 1, 'yellow', 'not_a_color'],
          StringType,
          context,
        );
        assert.strictEqual(isType(expression.type, StringType), true);
        assert.strictEqual(context.properties.get('attr'), NumberType);
      });

      it('respects the return type (color array)', () => {
        const expression = parse(
          ['match', ['get', 'attr'], 0, [1, 1, 0], 1, [1, 0, 1], [0, 1, 1]],
          ColorType,
          newParsingContext(),
        );
        assert.strictEqual(isType(expression.type, ColorType), true);
      });

      it('respects the return type (size)', () => {
        const context = newParsingContext();
        const expression = parse(
          ['match', ['get', 'shape'], 'light', 0.5, 0.7],
          SizeType,
          context,
        );
        assert.strictEqual(isType(expression.type, SizeType), true);
        assert.strictEqual(context.properties.get('shape'), StringType);
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
        assert.instanceOf(expression, CallExpression);
        assert.strictEqual(expression.operator, 'in');
        assert.strictEqual(isType(expression.type, BooleanType), true);
        assert.lengthOf(expression.args, 4);
        assert.strictEqual(isType(expression.args[0].type, NumberType), true);
        assert.strictEqual(isType(expression.args[1].type, NumberType), true);
        assert.strictEqual(isType(expression.args[2].type, NumberType), true);
        assert.strictEqual(isType(expression.args[3].type, NumberType), true);
        assert.strictEqual(context.properties.get('attr'), NumberType);
      });

      it('respects the return type (number haystack using literal operator)', () => {
        const context = newParsingContext();
        const expression = parse(
          ['in', ['get', 'attr'], ['literal', [0, 50, 100]]],
          BooleanType,
          context,
        );
        assert.instanceOf(expression, CallExpression);
        assert.strictEqual(expression.operator, 'in');
        assert.strictEqual(isType(expression.type, BooleanType), true);
        assert.lengthOf(expression.args, 4);
        assert.strictEqual(isType(expression.args[0].type, NumberType), true);
        assert.strictEqual(isType(expression.args[1].type, NumberType), true);
        assert.strictEqual(isType(expression.args[2].type, NumberType), true);
        assert.strictEqual(isType(expression.args[3].type, NumberType), true);
      });

      it('respects the return types (string haystack)', () => {
        const context = newParsingContext();
        const expression = parse(
          ['in', ['get', 'attr'], ['literal', ['ab', 'cd', 'ef', 'gh']]],
          BooleanType,
          context,
        );
        assert.instanceOf(expression, CallExpression);
        assert.strictEqual(expression.operator, 'in');
        assert.strictEqual(isType(expression.type, BooleanType), true);
        assert.lengthOf(expression.args, 5);
        assert.strictEqual(isType(expression.args[0].type, StringType), true);
        assert.strictEqual(isType(expression.args[1].type, StringType), true);
        assert.strictEqual(isType(expression.args[2].type, StringType), true);
        assert.strictEqual(isType(expression.args[3].type, StringType), true);
        assert.strictEqual(isType(expression.args[4].type, StringType), true);
        assert.strictEqual(context.properties.get('attr'), StringType);
      });
    });

    describe('array operator', () => {
      it('respects the return type (number array)', () => {
        const context = newParsingContext();
        const expression = parse(
          ['array', 1, 2, ['get', 'third'], 4, 5],
          NumberArrayType,
          context,
        );
        assert.strictEqual(expression.operator, 'array');
        assert.strictEqual(isType(expression.type, NumberArrayType), true);
        assert.lengthOf(expression.args, 5);
        assert.strictEqual(isType(expression.args[0].type, NumberType), true);
        assert.strictEqual(isType(expression.args[1].type, NumberType), true);
        assert.strictEqual(isType(expression.args[2].type, NumberType), true);
        assert.strictEqual(isType(expression.args[3].type, NumberType), true);
        assert.strictEqual(isType(expression.args[4].type, NumberType), true);
        assert.strictEqual(context.properties.get('third'), NumberType);
      });

      it('respects the return type (color)', () => {
        const context = newParsingContext();
        const expression = parse(
          ['array', 1, 2, ['get', 'blue']],
          ColorType,
          context,
        );
        assert.strictEqual(isType(expression.type, ColorType), true);
        assert.lengthOf(expression.args, 3);
        assert.strictEqual(isType(expression.args[0].type, NumberType), true);
        assert.strictEqual(isType(expression.args[1].type, NumberType), true);
        assert.strictEqual(isType(expression.args[2].type, NumberType), true);
        assert.strictEqual(context.properties.get('blue'), NumberType);
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
      {
        name: 'mismatch between expected types when reading a style variables',
        expression: [
          '+',
          ['var', 'myVar'],
          10,
          20,
          ['match', ['var', 'myVar'], 'aa', 30, 40],
        ],
        error:
          'a new type expected from the var operator (string) did not have any overlap with the previous type expected for it (number), variable name: myVar',
      },
      {
        name: 'mismatch between expected type and input values when reading a style variables',
        expression: ['+', ['var', 'myVar'], 123],
        context: {
          inputVariables: {
            myVar: 'hello',
          },
        },
        error:
          'the type expected from the var operator (number) did not have any overlap with the type of the corresponding style variables (string), variable name: myVar',
      },
    ];

    for (const {name, expression, error, context} of cases) {
      it(`throws for ${name}`, () => {
        const newContext = {...newParsingContext(), ...context};
        assert.throws(() => parse(expression, AnyType, newContext), error);
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
        assert.strictEqual(typeName(type), name);
      });
    }
  });

  describe('includesType()', () => {
    it('works for BooleanType', () => {
      assert.strictEqual(includesType(NoneType, BooleanType), false);
      assert.strictEqual(includesType(BooleanType, BooleanType), true);
      assert.strictEqual(includesType(StringType, BooleanType), false);
      assert.strictEqual(includesType(NumberType, BooleanType), false);
      assert.strictEqual(includesType(ColorType, BooleanType), false);
      assert.strictEqual(includesType(NumberArrayType, BooleanType), false);
      assert.strictEqual(includesType(AnyType, BooleanType), true);
    });

    it('works for StringType', () => {
      assert.strictEqual(includesType(NoneType, StringType), false);
      assert.strictEqual(includesType(BooleanType, StringType), false);
      assert.strictEqual(includesType(StringType, StringType), true);
      assert.strictEqual(includesType(NumberType, StringType), false);
      assert.strictEqual(includesType(ColorType, StringType), false);
      assert.strictEqual(includesType(NumberArrayType, StringType), false);
      assert.strictEqual(includesType(AnyType, StringType), true);
    });

    it('works for NumberType', () => {
      assert.strictEqual(includesType(NoneType, NumberType), false);
      assert.strictEqual(includesType(BooleanType, NumberType), false);
      assert.strictEqual(includesType(StringType, NumberType), false);
      assert.strictEqual(includesType(NumberType, NumberType), true);
      assert.strictEqual(includesType(ColorType, NumberType), false);
      assert.strictEqual(includesType(NumberArrayType, NumberType), false);
      assert.strictEqual(includesType(AnyType, NumberType), true);
    });

    it('works for ColorType', () => {
      assert.strictEqual(includesType(NoneType, ColorType), false);
      assert.strictEqual(includesType(BooleanType, ColorType), false);
      assert.strictEqual(includesType(StringType, ColorType), false);
      assert.strictEqual(includesType(NumberType, ColorType), false);
      assert.strictEqual(includesType(ColorType, ColorType), true);
      assert.strictEqual(includesType(NumberArrayType, ColorType), false);
      assert.strictEqual(includesType(AnyType, ColorType), true);
    });

    it('works for NumberArrayType', () => {
      assert.strictEqual(includesType(NoneType, NumberArrayType), false);
      assert.strictEqual(includesType(BooleanType, NumberArrayType), false);
      assert.strictEqual(includesType(StringType, NumberArrayType), false);
      assert.strictEqual(includesType(NumberType, NumberArrayType), false);
      assert.strictEqual(includesType(ColorType, NumberArrayType), false);
      assert.strictEqual(includesType(NumberArrayType, NumberArrayType), true);
      assert.strictEqual(includesType(AnyType, NumberArrayType), true);
    });
  });

  describe('isType()', () => {
    it('works for BooleanType', () => {
      assert.strictEqual(isType(NoneType, BooleanType), false);
      assert.strictEqual(isType(BooleanType, BooleanType), true);
      assert.strictEqual(isType(StringType, BooleanType), false);
      assert.strictEqual(isType(NumberType, BooleanType), false);
      assert.strictEqual(isType(ColorType, BooleanType), false);
      assert.strictEqual(isType(NumberArrayType, BooleanType), false);
      assert.strictEqual(isType(AnyType, BooleanType), false);
    });

    it('works for StringType', () => {
      assert.strictEqual(isType(NoneType, StringType), false);
      assert.strictEqual(isType(BooleanType, StringType), false);
      assert.strictEqual(isType(StringType, StringType), true);
      assert.strictEqual(isType(NumberType, StringType), false);
      assert.strictEqual(isType(ColorType, StringType), false);
      assert.strictEqual(isType(NumberArrayType, StringType), false);
      assert.strictEqual(isType(AnyType, StringType), false);
    });

    it('works for NumberType', () => {
      assert.strictEqual(isType(NoneType, NumberType), false);
      assert.strictEqual(isType(BooleanType, NumberType), false);
      assert.strictEqual(isType(StringType, NumberType), false);
      assert.strictEqual(isType(NumberType, NumberType), true);
      assert.strictEqual(isType(ColorType, NumberType), false);
      assert.strictEqual(isType(NumberArrayType, NumberType), false);
      assert.strictEqual(isType(AnyType, NumberType), false);
    });

    it('works for ColorType', () => {
      assert.strictEqual(isType(NoneType, ColorType), false);
      assert.strictEqual(isType(BooleanType, ColorType), false);
      assert.strictEqual(isType(StringType, ColorType), false);
      assert.strictEqual(isType(NumberType, ColorType), false);
      assert.strictEqual(isType(ColorType, ColorType), true);
      assert.strictEqual(isType(NumberArrayType, ColorType), false);
      assert.strictEqual(isType(AnyType, ColorType), false);
    });

    it('works for NumberArrayType', () => {
      assert.strictEqual(isType(NoneType, NumberArrayType), false);
      assert.strictEqual(isType(BooleanType, NumberArrayType), false);
      assert.strictEqual(isType(StringType, NumberArrayType), false);
      assert.strictEqual(isType(NumberType, NumberArrayType), false);
      assert.strictEqual(isType(ColorType, NumberArrayType), false);
      assert.strictEqual(isType(NumberArrayType, NumberArrayType), true);
      assert.strictEqual(isType(AnyType, NumberArrayType), false);
    });
  });
  describe('computeGeometryType', () => {
    it('returns empty string for falsy geom', () => {
      assert.deepEqual(computeGeometryType(undefined), '');
    });
    it('returns Point for Point geom', () => {
      assert.deepEqual(computeGeometryType(new Point([0, 1])), 'Point');
    });
    it('returns Polygon for MultiPolygon geom', () => {
      assert.deepEqual(computeGeometryType(new MultiPolygon([])), 'Polygon');
    });
    it('returns LineString for MultiLineString geom', () => {
      assert.deepEqual(
        computeGeometryType(new MultiLineString([])),
        'LineString',
      );
    });
    it('returns first geom type in geometry collection', () => {
      assert.deepEqual(
        computeGeometryType(new GeometryCollection([new Circle([0, 1])])),
        'Polygon',
      );
      assert.deepEqual(
        computeGeometryType(new GeometryCollection([new MultiPoint([])])),
        'Point',
      );
    });
    it('returns empty string for empty geom collection', () => {
      assert.deepEqual(computeGeometryType(new GeometryCollection([])), '');
    });
  });
});
