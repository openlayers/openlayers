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
  includesType,
  isType,
  newParsingContext,
  parse,
  typeName,
} from '../../../../src/ol/expr/expression.js';

describe('ol/expr/expression.js', () => {
  describe('parse()', () => {
    it('parses a literal boolean', () => {
      const expression = parse(true, newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(isType(expression.type, BooleanType));
      expect(expression.value).to.be(true);
    });

    it('parses a literal string', () => {
      const expression = parse('foo', newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(isType(expression.type, StringType));
      expect(expression.value).to.be('foo');
    });

    it('parses a literal number', () => {
      const expression = parse(42, newParsingContext());
      expect(expression).to.be.a(LiteralExpression);
      expect(isType(expression.type, NumberType));
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
      expect(isType(expression.type, AnyType));
      expect(context.properties.has('foo')).to.be(true);
    });

    it('parses a var expression', () => {
      const context = newParsingContext();
      const expression = parse(['var', 'foo'], context);
      expect(expression).to.be.a(CallExpression);
      expect(expression.operator).to.be('var');
      expect(isType(expression.type, AnyType));
      expect(context.variables.has('foo')).to.be(true);
    });

    it('parses a == expression', () => {
      const context = newParsingContext();
      const expression = parse(['==', ['get', 'foo'], 'bar'], context);
      expect(expression).to.be.a(CallExpression);
      expect(expression.operator).to.be('==');
      expect(isType(expression.type, BooleanType));
      expect(expression.args).to.have.length(2);
      expect(expression.args[0]).to.be.a(CallExpression);
      expect(expression.args[1]).to.be.a(LiteralExpression);
      expect(context.properties.has('foo')).to.be(true);
    });
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
});
