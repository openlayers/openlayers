import expect from '../../expect.js';
import {
  AnyType,
  BooleanType,
  CallExpression,
  ColorType,
  LiteralExpression,
  NoneType,
  NumberArrayType,
  NumberType,
  StringType,
  computeGeometryType,
  includesType,
  isType,
  newParsingContext,
  parse,
  typeName,
} from '../../../../src/ol/expr/expression.js';
import {
  Circle,
  GeometryCollection,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
} from '../../../../src/ol/geom.js';

describe('ol/expr/expression.js', () => {
  describe('parse()', () => {
    it('parses a literal boolean', () => {
      const expression = parse(true, newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(isType(expression.type, BooleanType)).to.be(true);
      expect(expression.value).to.be(true);
    });

    it('parses a literal string', () => {
      const expression = parse('foo', newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(isType(expression.type, StringType)).to.be(true);
      expect(expression.value).to.be('foo');
    });

    it('parses a literal number', () => {
      const expression = parse(42, newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(isType(expression.type, NumberType)).to.be(true);
      expect(expression.value).to.be(42);
    });

    it('parses a literal color', () => {
      const expression = parse([255, 0, 255], newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(includesType(expression.type, ColorType));
      expect(expression.value).to.eql([255, 0, 255]);
    });

    it('parses a literal number array', () => {
      const expression = parse([10, 20], newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(includesType(expression.type, NumberArrayType));
      expect(expression.value).to.eql([10, 20]);
    });

    it('parses a get expression', () => {
      const context = newParsingContext();
      const expression = parse(['get', 'foo'], context);
      expect(expression).to.be.a(CallExpression);
      expect(expression.operator).to.be('get');
      expect(isType(expression.type, AnyType)).to.be(true);
      expect(context.properties.has('foo')).to.be(true);
    });

    it('parses a get expression with type hint', () => {
      const context = newParsingContext();
      const expression = parse(['get', 'foo', 'number[]'], context);
      expect(isType(expression.type, NumberArrayType)).to.be(true);
    });

    it('parses a var expression', () => {
      const context = newParsingContext();
      const expression = parse(['var', 'foo'], context);
      expect(expression).to.be.a(CallExpression);
      expect(expression.operator).to.be('var');
      expect(isType(expression.type, AnyType)).to.be(true);
      expect(context.variables.has('foo')).to.be(true);
    });

    it('parses a var expression with initial value', () => {
      const context = newParsingContext();
      context.style.variables = {'foo': 'abcd'};
      const expression = parse(['var', 'foo'], context);
      expect(expression).to.be.a(CallExpression);
      expect(expression.operator).to.be('var');
      expect(isType(expression.type, StringType)).to.be(true);
      expect(context.variables.has('foo')).to.be(true);
    });

    it('parses a concat expression', () => {
      const context = newParsingContext();
      const expression = parse(
        ['concat', ['get', 'foo'], ' ', 'random'],
        context
      );
      expect(expression).to.be.a(CallExpression);
      expect(expression.operator).to.be('concat');
      expect(isType(expression.type, AnyType));
      expect(context.properties.has('foo')).to.be(true);
    });

    it('parses id expression', () => {
      const context = newParsingContext();
      const expression = parse(['id'], context);
      expect(context.featureId).to.be(true);

      expect(expression).to.be.a(CallExpression);
      expect(expression.operator).to.be('id');
      expect(isType(expression.type, StringType | NumberType));
    });

    it('parses a == expression', () => {
      const context = newParsingContext();
      const expression = parse(['==', ['get', 'foo'], 'bar'], context);
      expect(expression).to.be.a(CallExpression);
      expect(expression.operator).to.be('==');
      expect(isType(expression.type, BooleanType)).to.be(true);
      expect(expression.args).to.have.length(2);
      expect(expression.args[0]).to.be.a(CallExpression);
      expect(isType(expression.args[0].type, StringType)).to.be(true);
      expect(expression.args[1]).to.be.a(LiteralExpression);
      expect(isType(expression.args[1].type, StringType)).to.be(true);
      expect(context.properties.has('foo')).to.be(true);
    });

    it('parses a == expression with variable', () => {
      const context = {
        ...newParsingContext(),
        style: {
          variables: {foo: 'abc'},
        },
      };
      const expression = parse(
        ['==', ['var', 'foo'], 'bar'],
        context,
        BooleanType
      );
      expect(isType(expression.args[0].type, StringType)).to.be(true);
      expect(isType(expression.args[1].type, StringType)).to.be(true);
      expect(context.variables.has('foo')).to.be(true);
    });

    it('parses a * expression, narrows argument types', () => {
      const context = newParsingContext();
      const expression = parse(
        ['*', ['get', 'foo'], 'red', [255, 0, 0, 1]],
        context
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
      it('finds common output type (color)', () => {
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
          context
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
      it('finds common output type (string/color)', () => {
        const expression = parse(
          ['case', true, 'red', false, 'yellow', 'white'],
          newParsingContext()
        );
        expect(isType(expression.type, ColorType | StringType)).to.be(true);
      });
      it('finds common output type (string)', () => {
        const expression = parse(
          ['case', true, 'red', false, 'yellow', '42'],
          newParsingContext()
        );
        expect(isType(expression.type, StringType)).to.be(true);
      });
      it('finds common output type (number array, type hint)', () => {
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
          newParsingContext(),
          NumberArrayType
        );
        expect(isType(expression.type, NumberArrayType)).to.be(true);
        expect(isType(expression.args[1].type, NumberArrayType)).to.be(true);
        expect(isType(expression.args[3].type, NumberArrayType)).to.be(true);
        expect(isType(expression.args[5].type, NumberArrayType)).to.be(true);
        expect(isType(expression.args[6].type, NumberArrayType)).to.be(true);
      });
    });

    describe('match operation', () => {
      it('finds common input and output type (color)', () => {
        const context = newParsingContext();
        const expression = parse(
          ['match', ['get', 'attr'], 0, 'red', 1, 'yellow', [255, 0, 0, 1]],
          context
        );
        expect(expression).to.be.a(CallExpression);
        expect(expression.operator).to.be('match');
        expect(isType(expression.type, ColorType)).to.be(true);
        expect(expression.args).to.have.length(6);
        expect(isType(expression.args[0].type, NumberType)).to.be(true);
        expect(isType(expression.args[1].type, NumberType)).to.be(true);
        expect(isType(expression.args[2].type, ColorType)).to.be(true);
        expect(isType(expression.args[3].type, NumberType)).to.be(true);
        expect(isType(expression.args[4].type, ColorType)).to.be(true);
        expect(isType(expression.args[5].type, ColorType)).to.be(true);
      });
      it('finds common output type (string)', () => {
        const expression = parse(
          ['match', ['get', 'attr'], 0, 'red', 1, 'yellow', 'not_a_color'],
          newParsingContext()
        );
        expect(isType(expression.type, StringType)).to.be(true);
      });
      it('finds common output type (color/array)', () => {
        const expression = parse(
          ['match', ['get', 'attr'], 0, [1, 1, 0], 1, [1, 0, 1], [0, 1, 1]],
          newParsingContext()
        );
        expect(isType(expression.type, ColorType | NumberArrayType)).to.be(
          true
        );
      });
      it('finds common output type (color/string)', () => {
        const expression = parse(
          ['match', ['get', 'attr'], 0, 'red', 1, 'yellow', 'green'],
          newParsingContext()
        );
        expect(isType(expression.type, ColorType | StringType)).to.be(true);
      });
    });

    describe('in operation', () => {
      it('determines input and output types (number haystack)', () => {
        const context = newParsingContext();
        const expression = parse(
          ['in', ['get', 'attr'], [0, 50, 100]],
          context
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
      it('determines input and output types (string haystack)', () => {
        const context = newParsingContext();
        const expression = parse(
          ['in', ['get', 'attr'], ['literal', ['ab', 'cd', 'ef', 'gh']]],
          context
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

    describe('palette operator', () => {
      it('outputs color type and list of colors as args', () => {
        const expression = parse(
          ['palette', 1, ['red', 'rgba(255, 255, 0, 1)', [0, 255, 255]]],
          newParsingContext()
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

    describe('array operator', () => {
      it('outputs number array type if args count is not 3 or 4', () => {
        const expression = parse(
          ['array', 1, 2, ['get', 'third'], 4, 5],
          newParsingContext()
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
      it('outputs number array or color type if args count is 3 or 4', () => {
        const expression = parse(
          ['array', 1, 2, ['get', 'blue']],
          newParsingContext()
        );
        expect(isType(expression.type, NumberArrayType | ColorType)).to.be(
          true
        );
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
     * @property {number} [type] Expected type output; if undefined, use AnyType
     * @property {RegExp} error The expected error message.
     */

    /**
     * @type {Array<Case>}
     */
    const cases = [
      {
        name: 'interpolate with invalid method',
        expression: ['interpolate', ['invalid'], 0.5, 0, 0, 1, 1],
        error: 'Invalid interpolation type: ["invalid"]',
      },
      {
        name: 'interpolate with missing stop output',
        expression: ['interpolate', ['linear'], 0.5, 0, 0, 1, 1, 2, 2, 3],
        error:
          'An even amount of arguments was expected for operation interpolate, got 9 instead',
      },
      {
        name: 'interpolate with string input',
        expression: ['interpolate', ['linear'], 'oops', 0, 0, 1, 1],
        error:
          'Expected an input of type number for the interpolate operation, got string instead',
      },
      {
        name: 'interpolate with string stop input',
        expression: ['interpolate', ['linear'], 0.5, 0, 0, 1, 1, 'x', 2, 3, 3],
        error:
          'Expected all stop input values in the interpolate operation to be of type number, got string at position 6 instead',
      },
      {
        name: 'interpolate with string base',
        expression: ['interpolate', ['exponential', 'x'], 0.5, 0, 0, 1, 1],
        error:
          'Expected a number base for exponential interpolation, got "x" instead',
      },
      {
        name: 'variable not matching expected type',
        expression: ['var', 'myAttr'],
        context: {
          style: {
            variables: {
              myAttr: 12,
            },
          },
        },
        type: StringType,
        error:
          'The variable myAttr has type number but the following type was expected: string',
      },
      {
        name: 'invalid type hint (get)',
        expression: ['get', 'myAttr', 'invalid_type'],
        error: 'Unrecognized type hint: invalid_type',
      },
      {
        name: 'invalid expression',
        expression: null,
        error: 'Expression must be an array or a primitive value',
      },
      {
        name: 'invalid argument count (case)',
        expression: ['case', true, 0, false, 1],
        error:
          'An odd amount of arguments was expected for operation case, got 4 instead',
      },
      {
        name: 'a condition is not of type boolean (case)',
        expression: ['case', 123, 'red', false, 'yellow', 'white'],
        error:
          'Expected all conditions in the case operation to be of type boolean, got number at position 0 instead',
      },
      {
        name: 'no common output type could be found (case)',
        expression: ['case', true, 'red', false, '42', 123],
        error:
          'Could not find a common output type for the following case operation: ["case",true,"red",false,"42",123]',
      },
      {
        name: 'input is not string, number or boolean (match)',
        expression: ['match', 'input', 0, 'red', 1, 'yellow', 'green'],
        error:
          'Expected an input of type boolean, number, or string for the interpolate operation, got untyped instead',
      },
      {
        name: 'no common output type could be found (match)',
        expression: ['match', ['get', 'attr'], 0, 'red', 1, 123, 456],
        error:
          'Could not find a common output type for the following match operation: ["match",["get","attr"],0,"red",1,123,456]',
      },
      {
        name: 'no single output type could be inferred (in)',
        expression: ['in', ['get', 'attr'], [0, 'abc', 50]],
        error:
          'Could not find a common type for the following in operation: ["in",["get","attr"],[0,"abc",50]]',
      },
      {
        name: 'invalid argument count (in)',
        expression: ['in', ['get', 'attr'], 'abcd', 'efgh'],
        error: 'Expected 2 arguments for in, got 3',
      },
      {
        name: 'second argument is not an array (in)',
        expression: ['in', ['get', 'attr'], 'abcd'],
        error:
          'The "in" operator was provided a literal value which was not an array as second argument.',
      },
      {
        name: 'second argument is a string array but not wrapped in a literal operator (in)',
        expression: ['in', ['get', 'attr'], ['abcd', 'efgh', 'ijkl']],
        error:
          'For the "in" operator, a string array should be wrapped in a "literal" operator to disambiguate from expressions.',
      },
      {
        name: 'second argument is a literal value but not an array (in)',
        expression: ['in', ['get', 'attr'], ['literal', 123]],
        error:
          'The "in" operator was provided a literal value which was not an array as second argument.',
      },
      {
        name: 'first argument is not a number (palette)',
        expression: ['palette', 'abc', ['red', 'green', 'blue']],
        error:
          'The first argument of palette must be an number, got string instead',
      },
      {
        name: 'second argument is not an array (palette)',
        expression: ['palette', ['band', 2], 'red'],
        error: 'The second argument of palette must be an array',
      },
      {
        name: 'second argument is not an array of colors (palette)',
        expression: ['palette', ['band', 2], ['red', 'green', 'abcd']],
        error:
          'The palette color at index 2 should be of type color, got string instead',
      },
    ];

    for (const {name, expression, error, type, context} of cases) {
      it(`throws for ${name}`, () => {
        const newContext = {...newParsingContext(), ...context};
        expect(() =>
          parse(expression, newContext, type ?? AnyType)
        ).to.throwError((e) => expect(e.message).to.eql(error));
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
      {type: AnyType, name: 'boolean, number, string, color, or number[]'},
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
        computeGeometryType(new GeometryCollection([new Circle([0, 1])]))
      ).to.eql('Polygon');
      expect(
        computeGeometryType(new GeometryCollection([new MultiPoint([])]))
      ).to.eql('Point');
    });
    it('returns empty string for empty geom collection', () => {
      expect(computeGeometryType(new GeometryCollection([]))).to.eql('');
    });
  });
});
