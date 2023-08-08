import Feature from '../../../../../src/ol/Feature.js';
import {
  Circle,
  GeometryCollection,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
} from '../../../../../src/ol/geom.js';
import {
  ValueTypes,
  arrayToGlsl,
  colorToGlsl,
  expressionToGlsl,
  getValueType,
  isTypeUnique,
  numberToGlsl,
  stringToGlsl,
  uniformNameForVariable,
} from '../../../../../src/ol/style/expressions.js';

describe('ol/style/expressions', function () {
  describe('numberToGlsl', function () {
    it('does a simple transform when a fraction is present', function () {
      expect(numberToGlsl(1.3456)).to.eql('1.3456');
    });
    it('adds a fraction separator when missing', function () {
      expect(numberToGlsl(1)).to.eql('1.0');
      expect(numberToGlsl(2.0)).to.eql('2.0');
    });
  });

  describe('arrayToGlsl', function () {
    it('outputs numbers with dot separators', function () {
      expect(arrayToGlsl([1, 0, 3.45, 0.8888])).to.eql(
        'vec4(1.0, 0.0, 3.45, 0.8888)'
      );
      expect(arrayToGlsl([3, 4])).to.eql('vec2(3.0, 4.0)');
    });
    it('throws on invalid lengths', function () {
      expect(() => arrayToGlsl([3])).to.throwException();
      expect(() => arrayToGlsl([3, 2, 1, 0, -1])).to.throwException();
    });
  });

  describe('colorToGlsl', function () {
    it('normalizes color and outputs numbers with dot separators, including premultiplied alpha', function () {
      expect(colorToGlsl([100, 0, 255])).to.eql(
        'vec4(0.39215686274509803, 0.0, 1.0, 1.0)'
      );
      expect(colorToGlsl([100, 0, 255, 0.7])).to.eql(
        'vec4(0.2745098039215686, 0.0, 0.7, 0.7)'
      );
    });
    it('handles colors in string format', function () {
      expect(colorToGlsl('red')).to.eql('vec4(1.0, 0.0, 0.0, 1.0)');
      expect(colorToGlsl('#00ff99')).to.eql('vec4(0.0, 1.0, 0.6, 1.0)');
      expect(colorToGlsl('rgb(100, 0, 255)')).to.eql(
        'vec4(0.39215686274509803, 0.0, 1.0, 1.0)'
      );
      expect(colorToGlsl('rgba(100, 0, 255, 0.3)')).to.eql(
        'vec4(0.11764705882352941, 0.0, 0.3, 0.3)'
      );
    });
  });

  describe('stringToGlsl', function () {
    let context;
    beforeEach(function () {
      context = {
        stringLiteralsMap: {},
        functions: {},
        style: {},
      };
    });

    it('maps input string to stable numbers', function () {
      expect(stringToGlsl(context, 'abcd')).to.eql('0.0');
      expect(stringToGlsl(context, 'defg')).to.eql('1.0');
      expect(stringToGlsl(context, 'hijk')).to.eql('2.0');
      expect(stringToGlsl(context, 'abcd')).to.eql('0.0');
      expect(stringToGlsl(context, 'def')).to.eql('3.0');
    });
  });

  describe('isTypeUnique', function () {
    it('return true if only one value type', function () {
      expect(isTypeUnique(ValueTypes.NUMBER)).to.eql(true);
      expect(isTypeUnique(ValueTypes.STRING)).to.eql(true);
      expect(isTypeUnique(ValueTypes.COLOR)).to.eql(true);
    });
    it('return false if several value types', function () {
      expect(isTypeUnique(ValueTypes.NUMBER | ValueTypes.COLOR)).to.eql(false);
      expect(isTypeUnique(ValueTypes.ANY)).to.eql(false);
    });
    it('return false if no value type', function () {
      expect(isTypeUnique(ValueTypes.NUMBER & ValueTypes.COLOR)).to.eql(false);
    });
  });

  describe('getValueType', function () {
    it('correctly analyzes a literal value', function () {
      expect(getValueType(1234)).to.eql(ValueTypes.NUMBER);
      expect(getValueType([1, 2, 3, 4])).to.eql(
        ValueTypes.COLOR | ValueTypes.NUMBER_ARRAY
      );
      expect(getValueType([1, 2, 3])).to.eql(
        ValueTypes.COLOR | ValueTypes.NUMBER_ARRAY
      );
      expect(getValueType([1, 2])).to.eql(ValueTypes.NUMBER_ARRAY);
      expect(getValueType([1, 2, 3, 4, 5])).to.eql(ValueTypes.NUMBER_ARRAY);
      expect(getValueType('yellow')).to.eql(
        ValueTypes.COLOR | ValueTypes.STRING
      );
      expect(getValueType('#113366')).to.eql(
        ValueTypes.COLOR | ValueTypes.STRING
      );
      expect(getValueType('rgba(252,171,48,0.62)')).to.eql(
        ValueTypes.COLOR | ValueTypes.STRING
      );
      expect(getValueType('abcd')).to.eql(ValueTypes.STRING);
      expect(getValueType(true)).to.eql(ValueTypes.BOOLEAN);
    });

    it('throws on an unsupported type (object)', function () {
      expect(() => getValueType(new Object())).to.throwException();
    });

    it('throws on an unsupported type (mixed array)', function () {
      expect(() => getValueType([1, true, 'aa'])).to.throwException();
    });

    it('correctly analyzes operator return types', function () {
      expect(getValueType(['get', 'myAttr'])).to.eql(ValueTypes.ANY);
      expect(getValueType(['var', 'myVar'])).to.eql(ValueTypes.ANY);
      expect(getValueType(['time'])).to.eql(ValueTypes.NUMBER);
      expect(getValueType(['zoom'])).to.eql(ValueTypes.NUMBER);
      expect(getValueType(['resolution'])).to.eql(ValueTypes.NUMBER);
      expect(getValueType(['+', ['get', 'size'], 12])).to.eql(
        ValueTypes.NUMBER
      );
      expect(getValueType(['-', ['get', 'size'], 12])).to.eql(
        ValueTypes.NUMBER
      );
      expect(getValueType(['/', ['get', 'size'], 12])).to.eql(
        ValueTypes.NUMBER
      );
      expect(getValueType(['*', ['get', 'size'], 12])).to.eql(
        ValueTypes.NUMBER
      );
      expect(
        getValueType(['clamp', ['get', 'attr2'], ['get', 'attr3'], 20])
      ).to.eql(ValueTypes.NUMBER);
      expect(getValueType(['^', 10, 2])).to.eql(ValueTypes.NUMBER);
      expect(getValueType(['%', ['time'], 10])).to.eql(ValueTypes.NUMBER);
      expect(getValueType(['>', 10, ['get', 'attr4']])).to.eql(
        ValueTypes.BOOLEAN
      );
      expect(getValueType(['>=', 10, ['get', 'attr4']])).to.eql(
        ValueTypes.BOOLEAN
      );
      expect(getValueType(['<', 10, ['get', 'attr4']])).to.eql(
        ValueTypes.BOOLEAN
      );
      expect(getValueType(['<=', 10, ['get', 'attr4']])).to.eql(
        ValueTypes.BOOLEAN
      );
      expect(getValueType(['==', 10, ['get', 'attr4']])).to.eql(
        ValueTypes.BOOLEAN
      );
      expect(getValueType(['!=', 10, ['get', 'attr4']])).to.eql(
        ValueTypes.BOOLEAN
      );
      expect(getValueType(['all', true, ['get', 'attr4']])).to.eql(
        ValueTypes.BOOLEAN
      );
      expect(getValueType(['any', true, ['get', 'attr4']])).to.eql(
        ValueTypes.BOOLEAN
      );
      expect(getValueType(['between', ['get', 'attr4'], -4.0, 5.0])).to.eql(
        ValueTypes.BOOLEAN
      );
      expect(getValueType(['!', ['get', 'attr4']])).to.eql(ValueTypes.BOOLEAN);
      expect(getValueType(['array', ['get', 'attr4'], 1, 2, 3])).to.eql(
        ValueTypes.NUMBER_ARRAY
      );
      expect(getValueType(['color', ['get', 'attr4'], 1, 2])).to.eql(
        ValueTypes.COLOR
      );
      expect(getValueType(['in', ['get', 'attr4'], 1, 2, 3])).to.eql(
        ValueTypes.BOOLEAN
      );
    });
    it('correctly analyzes get operator return type with hint', function () {
      expect(getValueType(['get', 'myAttr', 'number'])).to.eql(
        ValueTypes.NUMBER
      );
      expect(getValueType(['get', 'myAttr', 'string'])).to.eql(
        ValueTypes.STRING
      );
      expect(getValueType(['get', 'myAttr', 'boolean'])).to.eql(
        ValueTypes.BOOLEAN
      );
      expect(getValueType(['get', 'myAttr', 'number[]'])).to.eql(
        ValueTypes.NUMBER_ARRAY
      );
      expect(getValueType(['get', 'myAttr', 'color'])).to.eql(ValueTypes.COLOR);
    });
    it('throws on invalid hint', function () {
      expect(() => getValueType(['get', 'myAttr', 'weird-type'])).to.throwError(
        /Unrecognized type hint/
      );
    });
  });

  describe('expressionToGlsl', function () {
    let context;

    beforeEach(function () {
      context = {
        variables: [],
        attributes: [],
        stringLiteralsMap: {},
        functions: {},
        style: {
          variables: {
            myVar: 12,
            myVar2: 16,
          },
        },
      };
    });

    it('correctly converts expressions to GLSL', function () {
      expect(expressionToGlsl(context, ['get', 'myAttr'])).to.eql('a_myAttr');
      expect(expressionToGlsl(context, ['var', 'myVar'])).to.eql(
        uniformNameForVariable('myVar')
      );
      expect(expressionToGlsl(context, ['time'])).to.eql('u_time');
      expect(expressionToGlsl(context, ['zoom'])).to.eql('u_zoom');
      expect(expressionToGlsl(context, ['resolution'])).to.eql('u_resolution');

      expect(expressionToGlsl(context, ['+', 1, 2, 3, 4])).to.eql(
        '(1.0 + 2.0 + 3.0 + 4.0)'
      );
      expect(expressionToGlsl(context, ['*', 1, 2, 3, 4])).to.eql(
        '(1.0 * 2.0 * 3.0 * 4.0)'
      );
      expect(
        expressionToGlsl(
          context,
          ['*', [255, 127.5, 0, 0.5], 'red'],
          ValueTypes.ANY
        )
      ).to.eql('(vec4(0.5, 0.25, 0.0, 0.5) * vec4(1.0, 0.0, 0.0, 1.0))');

      expect(
        expressionToGlsl(context, ['+', ['*', ['get', 'size'], 0.001], 12])
      ).to.eql('((a_size * 0.001) + 12.0)');
      expect(
        expressionToGlsl(context, ['/', ['-', ['get', 'size'], 20], 100])
      ).to.eql('((a_size - 20.0) / 100.0)');
      expect(
        expressionToGlsl(context, [
          'clamp',
          ['get', 'attr2'],
          ['get', 'attr3'],
          20,
        ])
      ).to.eql('clamp(a_attr2, a_attr3, 20.0)');
      expect(expressionToGlsl(context, ['^', ['%', ['time'], 10], 2])).to.eql(
        'pow(mod(u_time, 10.0), 2.0)'
      );
      expect(
        expressionToGlsl(context, [
          'abs',
          ['-', ['get', 'attr3'], ['get', 'attr2']],
        ])
      ).to.eql('abs((a_attr3 - a_attr2))');
      expect(expressionToGlsl(context, ['floor', 1])).to.eql('floor(1.0)');
      expect(expressionToGlsl(context, ['round', 1])).to.eql(
        'floor(1.0 + 0.5)'
      );
      expect(expressionToGlsl(context, ['ceil', 1])).to.eql('ceil(1.0)');
      expect(expressionToGlsl(context, ['sin', 1])).to.eql('sin(1.0)');
      expect(expressionToGlsl(context, ['cos', 1])).to.eql('cos(1.0)');
      expect(expressionToGlsl(context, ['atan', 1])).to.eql('atan(1.0)');
      expect(expressionToGlsl(context, ['atan', 1, 0.5])).to.eql(
        'atan(1.0, 0.5)'
      );
      expect(expressionToGlsl(context, ['sqrt', 100])).to.eql('sqrt(100.0)');

      expect(expressionToGlsl(context, ['>', 10, ['get', 'attr4']])).to.eql(
        '(10.0 > a_attr4)'
      );
      expect(expressionToGlsl(context, ['>=', 10, ['get', 'attr4']])).to.eql(
        '(10.0 >= a_attr4)'
      );
      expect(expressionToGlsl(context, ['<', 10, ['get', 'attr4']])).to.eql(
        '(10.0 < a_attr4)'
      );
      expect(expressionToGlsl(context, ['<=', 10, ['get', 'attr4']])).to.eql(
        '(10.0 <= a_attr4)'
      );
      expect(expressionToGlsl(context, ['==', 10, ['get', 'attr4']])).to.eql(
        '(10.0 == a_attr4)'
      );
      expect(expressionToGlsl(context, ['==', 'red', ['get', 'attr5']])).to.eql(
        `(${stringToGlsl(context, 'red')} == a_attr5)`
      );
      expect(expressionToGlsl(context, ['!=', 10, ['get', 'attr4']])).to.eql(
        '(10.0 != a_attr4)'
      );
      expect(expressionToGlsl(context, ['all', true, ['get', 'attr6']])).to.eql(
        '(true && a_attr6)'
      );
      expect(expressionToGlsl(context, ['any', true, ['get', 'attr6']])).to.eql(
        '(true || a_attr6)'
      );
      expect(
        expressionToGlsl(context, ['any', true, ['get', 'attr6'], true])
      ).to.eql('(true || a_attr6 || true)');
      expect(
        expressionToGlsl(context, ['between', ['get', 'attr4'], -4.0, 5.0])
      ).to.eql('(a_attr4 >= -4.0 && a_attr4 <= 5.0)');
      expect(expressionToGlsl(context, ['!', ['get', 'attr6']])).to.eql(
        '(!a_attr6)'
      );
      expect(
        expressionToGlsl(context, ['array', ['get', 'attr4'], 1, 2, 3])
      ).to.eql('vec4(a_attr4, 1.0, 2.0, 3.0)');
      expect(
        expressionToGlsl(context, ['color', ['get', 'attr4'], 1, 2, 0.5])
      ).to.eql('(0.5 * vec4(a_attr4 / 255.0, 1.0 / 255.0, 2.0 / 255.0, 1.0))');
      expect(expressionToGlsl(context, ['band', 1])).to.eql(
        'getBandValue(1.0, 0.0, 0.0)'
      );
      expect(expressionToGlsl(context, ['band', 1, -1, 2])).to.eql(
        'getBandValue(1.0, -1.0, 2.0)'
      );
    });

    it('throws if the value does not match the type', function () {
      const call = function () {
        expressionToGlsl(context, '42', ValueTypes.NUMBER);
      };
      expect(call).to.throwException(/No matching type was found/);
    });

    it('correctly adapts output for fragment shaders', function () {
      context.inFragmentShader = true;
      expect(expressionToGlsl(context, ['get', 'myAttr'])).to.eql('v_myAttr');
    });

    it('gives precedence to the string type unless asked otherwise', function () {
      expect(expressionToGlsl(context, 'lightgreen', ValueTypes.ANY)).to.eql(
        '0.0'
      );
      expect(expressionToGlsl(context, 'lightgreen', ValueTypes.COLOR)).to.eql(
        'vec4(0.5647058823529412, 0.9333333333333333, 0.5647058823529412, 1.0)'
      );
    });

    it('throws on unsupported types for operators', function () {
      expect(() =>
        expressionToGlsl(context, ['var', 1234])
      ).to.throwException();

      expect(() =>
        expressionToGlsl(context, ['any', ['var', 'aa'], 10])
      ).to.throwException();

      expect(() =>
        expressionToGlsl(context, ['all', ['var', 'aa'], 10])
      ).to.throwException();

      expect(() =>
        expressionToGlsl(context, ['<', 0, 'aa'])
      ).to.throwException();

      expect(() =>
        expressionToGlsl(context, ['+', true, ['get', 'attr']])
      ).to.throwException();

      expect(() =>
        expressionToGlsl(context, ['color', 1, 2, 'red'])
      ).to.throwException();

      expect(() =>
        expressionToGlsl(context, ['array', 1, '2', 3])
      ).to.throwException();
    });

    it('throws with the wrong number of arguments', function () {
      expect(() =>
        expressionToGlsl(context, ['var', 1234, 456])
      ).to.throwException();

      expect(() =>
        expressionToGlsl(context, ['all', ['var', true], ['get', true], true])
      ).to.throwException();

      expect(() =>
        expressionToGlsl(context, ['any', ['var', true]])
      ).to.throwException();

      expect(() => expressionToGlsl(context, ['<', 4])).to.throwException();

      expect(() => expressionToGlsl(context, ['+'])).to.throwException();

      expect(() => expressionToGlsl(context, ['array', 1])).to.throwException();

      expect(() =>
        expressionToGlsl(context, ['color', 1, 2, 3, 4, 5])
      ).to.throwException();

      expect(() =>
        expressionToGlsl(context, ['sqrt', 1, 2])
      ).to.throwException();
    });

    it('throws on invalid expressions', function () {
      expect(() => expressionToGlsl(context, null)).to.throwException();
    });

    it('throws when using a variable not defined in the style', () => {
      expect(() => expressionToGlsl(context, ['var', 'myAttr'])).to.throwError(
        /variable is missing/
      );
    });
  });

  describe('case operator', function () {
    let context;

    beforeEach(function () {
      context = {
        variables: [],
        attributes: [],
        stringLiteralsMap: {},
        functions: {},
        style: {},
      };
    });

    it('correctly guesses the output type', function () {
      expect(getValueType(['case', true, 0, false, [3, 4, 5], 'green'])).to.eql(
        ValueTypes.NONE
      );
      expect(getValueType(['case', true, 0, false, 1, 2])).to.eql(
        ValueTypes.NUMBER
      );
      expect(
        getValueType([
          'case',
          true,
          [0, 0, 0],
          true,
          [1, 2, 3],
          ['get', 'attr'],
          [4, 5, 6, 7],
          [8, 9, 0],
        ])
      ).to.eql(ValueTypes.COLOR | ValueTypes.NUMBER_ARRAY);
      expect(
        getValueType([
          'case',
          true,
          'red',
          true,
          'yellow',
          ['get', 'attr'],
          'green',
          'white',
        ])
      ).to.eql(ValueTypes.COLOR | ValueTypes.STRING);
      expect(
        getValueType(['case', true, [0, 0], false, [1, 1], [2, 2]])
      ).to.eql(ValueTypes.NUMBER_ARRAY);
    });

    it('throws if no single output type could be inferred', function () {
      expect(() =>
        expressionToGlsl(
          context,
          ['case', false, 'red', true, 'yellow', 'green'],
          ValueTypes.COLOR
        )
      ).not.to.throwException();

      expect(() =>
        expressionToGlsl(context, [
          'case',
          true,
          'red',
          true,
          'yellow',
          'green',
        ])
      ).to.throwException();

      expect(() =>
        expressionToGlsl(
          context,
          ['case', true, 'red', false, 'yellow', 'green'],
          ValueTypes.NUMBER
        )
      ).to.throwException();

      expect(() =>
        expressionToGlsl(
          context,
          ['case', true, 'red', false, 'yellow', 'not_a_color'],
          ValueTypes.COLOR
        )
      ).to.throwException();
    });

    it('throws if invalid argument count', function () {
      expect(() =>
        expressionToGlsl(context, ['case', true, 0, false, 1])
      ).to.throwException();

      expect(() =>
        expressionToGlsl(context, ['case', true, 0])
      ).to.throwException();

      expect(() =>
        expressionToGlsl(context, ['case', false])
      ).to.throwException();
    });

    it('correctly parses the expression (colors)', function () {
      expect(
        expressionToGlsl(
          context,
          [
            'case',
            ['>', ['get', 'attr'], 3],
            'red',
            ['>', ['get', 'attr'], 1],
            'yellow',
            'white',
          ],
          ValueTypes.COLOR
        )
      ).to.eql(
        '((a_attr > 3.0) ? vec4(1.0, 0.0, 0.0, 1.0) : ((a_attr > 1.0) ? vec4(1.0, 1.0, 0.0, 1.0) : vec4(1.0, 1.0, 1.0, 1.0)))'
      );
    });
  });

  describe('match operator', function () {
    let context;

    beforeEach(function () {
      context = {
        variables: [],
        attributes: [],
        stringLiteralsMap: {},
        functions: {},
        style: {},
      };
    });

    it('correctly guesses the output type', function () {
      expect(
        getValueType(['match', ['get', 'attr'], 0, 'red', 1, 'yellow', 'green'])
      ).to.eql(ValueTypes.STRING | ValueTypes.COLOR);
      expect(
        getValueType([
          'match',
          ['get', 'attr'],
          0,
          'not_a_color',
          1,
          'yellow',
          'green',
        ])
      ).to.eql(ValueTypes.STRING);
      expect(
        getValueType([
          'match',
          ['get', 'attr'],
          0,
          'red',
          1,
          'yellow',
          'not_a_color',
        ])
      ).to.eql(ValueTypes.STRING);
      expect(
        getValueType([
          'match',
          ['get', 'attr'],
          0,
          [1, 1, 0],
          1,
          [1, 0, 1],
          [0, 1, 1],
        ])
      ).to.eql(ValueTypes.COLOR | ValueTypes.NUMBER_ARRAY);
      expect(
        getValueType([
          'match',
          ['get', 'attr'],
          0,
          [1, 1, 0],
          1,
          [1, 0, 1],
          'white',
        ])
      ).to.eql(ValueTypes.COLOR);
      expect(
        getValueType(['match', ['get', 'attr'], 0, 'red', 1, true, 100])
      ).to.eql(ValueTypes.NONE);
      expect(
        getValueType(['match', ['get', 'attr'], 0, false, 1, true, false])
      ).to.eql(ValueTypes.BOOLEAN);
      expect(
        getValueType(['match', ['get', 'attr'], 0, 100, 1, 200, 300])
      ).to.eql(ValueTypes.NUMBER);
    });

    it('throws if no single output type could be inferred', function () {
      expect(() =>
        expressionToGlsl(
          context,
          ['match', ['get', 'attr'], 0, 'red', 1, 'yellow', 'green'],
          ValueTypes.COLOR
        )
      ).not.to.throwException();

      expect(() =>
        expressionToGlsl(context, [
          'match',
          ['get', 'attr'],
          0,
          'red',
          1,
          'yellow',
          'green',
        ])
      ).to.throwException();

      expect(() =>
        expressionToGlsl(
          context,
          ['match', ['get', 'attr'], 0, 'red', 1, 'yellow', 'green'],
          ValueTypes.NUMBER
        )
      ).to.throwException();
    });

    it('throws if invalid argument count', function () {
      expect(() =>
        expressionToGlsl(context, [
          'match',
          ['get', 'attr'],
          0,
          true,
          false,
          false,
        ])
      ).to.throwException();

      expect(() =>
        expressionToGlsl(context, ['match', ['get', 'attr'], 0, true])
      ).to.throwException();

      expect(() =>
        expressionToGlsl(context, ['match', ['get', 'attr'], 0])
      ).to.throwException();
    });

    it('correctly parses the expression (colors)', function () {
      expect(
        expressionToGlsl(
          context,
          ['match', ['get', 'attr'], 0, 'red', 1, 'yellow', 'white'],
          ValueTypes.COLOR
        )
      ).to.eql(
        '(a_attr == 0.0 ? vec4(1.0, 0.0, 0.0, 1.0) : (a_attr == 1.0 ? vec4(1.0, 1.0, 0.0, 1.0) : vec4(1.0, 1.0, 1.0, 1.0)))'
      );
    });

    it('correctly parses the expression (strings)', function () {
      function toGlsl(string) {
        return stringToGlsl(context, string);
      }
      expect(
        expressionToGlsl(
          context,
          ['match', ['get', 'attr'], 10, 'red', 20, 'yellow', 'white'],
          ValueTypes.STRING
        )
      ).to.eql(
        `(a_attr == 10.0 ? ${toGlsl('red')} : (a_attr == 20.0 ? ${toGlsl(
          'yellow'
        )} : ${toGlsl('white')}))`
      );
    });

    it('correctly parses the expression (number arrays)', function () {
      function toGlsl(string) {
        return stringToGlsl(context, string);
      }
      expect(
        expressionToGlsl(
          context,
          ['match', ['get', 'attr'], 'low', [0, 0], 'high', [0, 1], [1, 0]],
          ValueTypes.NUMBER_ARRAY
        )
      ).to.eql(
        `(a_attr == ${toGlsl('low')} ? vec2(0.0, 0.0) : (a_attr == ${toGlsl(
          'high'
        )} ? vec2(0.0, 1.0) : vec2(1.0, 0.0)))`
      );
      expect(
        expressionToGlsl(
          context,
          [
            'match',
            ['get', 'attr2'],
            0,
            [0, 0, 1, 1],
            1,
            [1, 1, 2, 2],
            2,
            [2, 2, 3, 3],
            [3, 3, 4, 4],
          ],
          ValueTypes.NUMBER_ARRAY
        )
      ).to.eql(
        '(a_attr2 == 0.0 ? vec4(0.0, 0.0, 1.0, 1.0) : (a_attr2 == 1.0 ? vec4(1.0, 1.0, 2.0, 2.0) : (a_attr2 == 2.0 ? vec4(2.0, 2.0, 3.0, 3.0) : vec4(3.0, 3.0, 4.0, 4.0))))'
      );
    });

    it('only expects string, number or boolean as input', () => {
      // match input is only expressed through get operator and values which can be strings or colors
      // the call shouldn't throw because match does not allow color as input (so the final input type is string)
      expect(() =>
        expressionToGlsl(
          context,
          ['match', ['get', 'attr3'], 'red', [6, 0], 'green', [3, 0], [0, 0]],
          ValueTypes.ANY
        )
      ).not.to.throwException();
    });
  });

  describe('interpolate operator', function () {
    let context;

    beforeEach(function () {
      context = {
        variables: [],
        attributes: [],
        stringLiteralsMap: {},
        functions: {},
        style: {
          variables: {
            value: 12,
          },
        },
      };
    });

    it('correctly guesses the output type', function () {
      expect(
        getValueType([
          'interpolate',
          ['linear'],
          ['get', 'attr'],
          0,
          'red',
          100,
          'yellow',
        ])
      ).to.eql(ValueTypes.COLOR);
      expect(
        getValueType([
          'interpolate',
          ['linear'],
          ['get', 'attr'],
          0,
          [1, 2, 3],
          1,
          [0, 0, 0, 4],
        ])
      ).to.eql(ValueTypes.COLOR);
      expect(
        getValueType([
          'interpolate',
          ['linear'],
          ['get', 'attr'],
          1000,
          -10,
          2000,
          10,
        ])
      ).to.eql(ValueTypes.NUMBER);
    });

    it('throws if no single output type could be inferred', function () {
      expect(() =>
        expressionToGlsl(
          context,
          ['interpolate', ['linear'], ['get', 'attr'], 1000, -10, 2000, 10],
          ValueTypes.COLOR
        )
      ).to.throwException();

      expect(() =>
        expressionToGlsl(context, [
          'interpolate',
          ['linear'],
          ['get', 'attr'],
          0,
          [1, 2, 3],
          1,
          222,
        ])
      ).to.throwException();

      expect(() =>
        expressionToGlsl(
          context,
          [
            'interpolate',
            ['linear'],
            ['get', 'attr'],
            0,
            [1, 2, 3],
            1,
            [0, 0, 0, 4],
          ],
          ValueTypes.NUMBER
        )
      ).to.throwException();
    });

    it('throws if invalid argument count', function () {
      expect(() =>
        expressionToGlsl(context, [
          'interpolate',
          ['linear'],
          ['get', 'attr'],
          1000,
        ])
      ).to.throwException();

      expect(() =>
        expressionToGlsl(context, [
          'interpolate',
          ['linear'],
          ['get', 'attr'],
          1000,
          -10,
          2000,
          10,
          5000,
        ])
      ).to.throwException();
    });

    it('throws if an invalid interpolation type is given', function () {
      expect(() =>
        expressionToGlsl(context, [
          'interpolate',
          'linear',
          ['get', 'attr'],
          1000,
          0,
          2000,
          1,
        ])
      ).to.throwException();

      expect(() =>
        expressionToGlsl(context, [
          'interpolate',
          ['exponential'],
          ['get', 'attr'],
          1000,
          -10,
          2000,
          1,
        ])
      ).to.throwException();

      expect(() =>
        expressionToGlsl(context, [
          'interpolate',
          ['not_a_type'],
          ['get', 'attr'],
          1000,
          -10,
          2000,
          1,
        ])
      ).to.throwException();
    });

    it('correctly parses the expression (colors, linear)', function () {
      expect(
        expressionToGlsl(
          context,
          [
            'interpolate',
            ['linear'],
            ['get', 'attr'],
            1000,
            [255, 0, 0],
            2000,
            [0, 255, 0],
          ],
          ValueTypes.ANY
        )
      ).to.eql(
        'mix(vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 1.0, 0.0, 1.0), clamp((a_attr - 1000.0) / (2000.0 - 1000.0), 0.0, 1.0))'
      );
      expect(
        expressionToGlsl(
          context,
          [
            'interpolate',
            ['linear'],
            ['get', 'attr'],
            1000,
            [255, 0, 0],
            2000,
            [0, 255, 0],
            5000,
            [0, 0, 255],
          ],
          ValueTypes.ANY
        )
      ).to.eql(
        'mix(mix(vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 1.0, 0.0, 1.0), clamp((a_attr - 1000.0) / (2000.0 - 1000.0), 0.0, 1.0)), vec4(0.0, 0.0, 1.0, 1.0), clamp((a_attr - 2000.0) / (5000.0 - 2000.0), 0.0, 1.0))'
      );
    });

    it('correctly parses the expression (number, linear)', function () {
      expect(
        expressionToGlsl(context, [
          'interpolate',
          ['linear'],
          ['get', 'attr'],
          1000,
          -10,
          2000,
          0,
          5000,
          10,
        ])
      ).to.eql(
        'mix(mix(-10.0, 0.0, clamp((a_attr - 1000.0) / (2000.0 - 1000.0), 0.0, 1.0)), 10.0, clamp((a_attr - 2000.0) / (5000.0 - 2000.0), 0.0, 1.0))'
      );
    });

    it('correctly parses the expression (number, exponential)', function () {
      expect(
        expressionToGlsl(context, [
          'interpolate',
          ['exponential', 0.5],
          ['get', 'attr'],
          1000,
          -10,
          2000,
          0,
          5000,
          10,
        ])
      ).to.eql(
        'mix(mix(-10.0, 0.0, clamp((pow(0.5, (a_attr - 1000.0)) - 1.0) / (pow(0.5, (2000.0 - 1000.0)) - 1.0), 0.0, 1.0)), 10.0, clamp((pow(0.5, (a_attr - 2000.0)) - 1.0) / (pow(0.5, (5000.0 - 2000.0)) - 1.0), 0.0, 1.0))'
      );
    });

    it('only expects number as input', () => {
      // interpolation input is only expressed through get and var operators, which means that it is unspecified on its own
      // the call shouldn't throw because interpolation only accepts numerical input
      expect(() =>
        expressionToGlsl(
          context,
          [
            'interpolate',
            ['linear'],
            ['get', 'attr'],
            1000,
            ['var', 'value'],
            2000,
            3000,
          ],
          ValueTypes.ANY
        )
      ).not.to.throwException();
    });
  });

  describe('in operator', function () {
    let context;

    beforeEach(function () {
      context = {
        variables: [],
        attributes: [],
        stringLiteralsMap: {},
        functions: {},
        style: {},
      };
    });

    it('outputs boolean', function () {
      expect(getValueType(['in', ['get', 'attr'], [0, 50, 100]])).to.eql(
        ValueTypes.BOOLEAN
      );
    });

    it('throws if no single output type could be inferred', function () {
      expect(() => {
        expressionToGlsl(
          context,
          ['in', ['get', 'attr'], [0, 'abc', 50]],
          ValueTypes.COLOR
        );
      }).to.throwException(/got these types instead/i);
    });

    it('throws if invalid argument count', function () {
      expect(() => {
        expressionToGlsl(context, ['in', ['get', 'attr'], 'abcd', 'efgh']);
      }).to.throwException(/2 arguments were expected/);
    });

    it('throws if second argument is not an array', function () {
      expect(() => {
        expressionToGlsl(context, ['in', ['get', 'attr'], 'abcd']);
      }).to.throwException(/expects an array literal/);
    });

    it('throws if second argument is a string array but not wrapped in a literal operator', function () {
      expect(() => {
        expressionToGlsl(context, [
          'in',
          ['get', 'attr'],
          ['abcd', 'efgh', 'ijkl'],
        ]);
      }).to.throwException(/should be wrapped in a "literal" operator/);
    });

    it('throws if second argument is a literal value but not an array', function () {
      expect(() => {
        expressionToGlsl(context, ['in', ['get', 'attr'], ['literal', 123]]);
      }).to.throwException(/a literal value which was not an array/);
    });

    it('correctly parses the expression (number haystack)', function () {
      context.functions['a_function'] = 'float a_function() { return 1.0; }';
      context.functions['another_function'] =
        'float another_function() { return 1.0; }';
      const glsl = expressionToGlsl(context, [
        'in',
        ['get', 'attr'],
        [0, 20, 50],
      ]);
      expect(glsl).to.eql('operator_in_2(a_attr)');
      expect(context.functions).to.have.property('operator_in_2');
      expect(context.functions['operator_in_2']).to
        .eql(`bool operator_in_2(float inputValue) {
  if (inputValue == 0.0) { return true; }
  if (inputValue == 20.0) { return true; }
  if (inputValue == 50.0) { return true; }
  return false;
}`);
    });

    it('correctly parses the expression (string haystack)', function () {
      const glsl = expressionToGlsl(context, [
        'in',
        ['get', 'attr'],
        ['literal', ['abc', 'def', 'ghi']],
      ]);
      expect(glsl).to.eql('operator_in_0(a_attr)');
      expect(context.functions).to.have.property('operator_in_0');
      expect(context.functions['operator_in_0']).to
        .eql(`bool operator_in_0(float inputValue) {
  if (inputValue == 0.0) { return true; }
  if (inputValue == 1.0) { return true; }
  if (inputValue == 2.0) { return true; }
  return false;
}`);
    });
  });

  describe('geometry-type operator', function () {
    let context;

    beforeEach(function () {
      context = {
        variables: [],
        attributes: [],
        stringLiteralsMap: {},
        functions: {},
        style: {},
      };
    });

    it('outputs string', function () {
      expect(getValueType(['geometry-type'])).to.eql(ValueTypes.STRING);
    });

    it('throws if invalid argument count', function () {
      expect(() => {
        expressionToGlsl(context, ['geometry-type', 'abcd']);
      }).to.throwException(/0 arguments were expected/);
    });

    it('correctly parses the expression and add a new attribute', function () {
      const glsl = expressionToGlsl(context, ['geometry-type']);
      expect(glsl).to.eql('a_geometryType');
      expect(context.attributes[0].name).to.be('geometryType');
      expect(context.attributes[0].type).to.be(ValueTypes.STRING);
      expect(context.attributes[0].callback).to.be.a(Function);
    });

    describe('geometry type computation', () => {
      let features, callback;
      beforeEach(() => {
        expressionToGlsl(context, ['geometry-type']);
        callback = context.attributes[0]['callback'];
        features = [
          new Feature(new Point([0, 1])),
          new Feature(new MultiPolygon([])),
          new Feature(new MultiLineString([])),
          new Feature(new GeometryCollection([new Circle([0, 1])])),
          new Feature(new GeometryCollection([new MultiPoint([])])),
        ];
      });

      it('computes a standard geometry type from the given features', function () {
        expect(features.map(callback)).to.eql([
          'Point',
          'Polygon',
          'LineString',
          'Polygon',
          'Point',
        ]);
      });
    });
  });

  describe('complex expressions', function () {
    let context;

    beforeEach(function () {
      context = {
        variables: [],
        attributes: [],
        stringLiteralsMap: {},
        functions: {},
        style: {
          variables: {
            defaultWidth: 12,
            defaultHeight: 24,
          },
        },
      };
    });

    it('correctly parses a combination of interpolate, match, color and number', function () {
      const expression = [
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
                ['interpolate', ['linear'], ['get', 'year'], 1850, 0, 2015, 8],
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
      ];
      expect(expressionToGlsl(context, expression, ValueTypes.COLOR)).to.eql(
        'mix(vec4(0.5, 0.5, 0.0, 0.5), (a_year == 2000.0 ? vec4(0.0, 0.5019607843137255, 0.0, 1.0) : vec4(1.0, 0.8980392156862745, 0.17254901960784313, 1.0)), clamp((pow((mod((u_time + mix(0.0, 8.0, clamp((a_year - 1850.0) / (2015.0 - 1850.0), 0.0, 1.0))), 8.0) / 8.0), 0.5) - 0.0) / (1.0 - 0.0), 0.0, 1.0))'
      );
    });

    it('correctly parses the expression (array for symbol size, variables and attributes)', function () {
      expect(
        expressionToGlsl(
          context,
          [
            'array',
            [
              'ceil',
              [
                'match',
                ['get', 'width'],
                0,
                ['var', 'defaultWidth'],
                ['get', 'width'],
              ],
            ],
            [
              'ceil',
              [
                'match',
                ['get', 'height'],
                0,
                ['var', 'defaultHeight'],
                ['get', 'height'],
              ],
            ],
          ],
          ValueTypes.NUMBER | ValueTypes.NUMBER_ARRAY
        )
      ).to.eql(
        'vec2(ceil((a_width == 0.0 ? u_var_defaultWidth : a_width)), ceil((a_height == 0.0 ? u_var_defaultHeight : a_height)))'
      );
    });
  });

  describe('attributes and variables collection', () => {
    let context;
    beforeEach(function () {
      context = {
        variables: [],
        attributes: [],
        stringLiteralsMap: {},
        functions: {},
        style: {
          variables: {
            color: 'red',
            fixedSize: [10, 20],
            selected: true,
            symbolType: 'dynamic',
            oldColor: 'blue',
            newColor: 'green',
            lowHeight: 6,
            mediumHeight: 12,
          },
        },
      };
    });

    it('get operator with type hint', () => {
      const result = expressionToGlsl(
        context,
        ['get', 'color'],
        ValueTypes.COLOR
      );
      expect(result).to.eql('a_color');
      expect(context.attributes).to.eql([
        {
          name: 'color',
          type: ValueTypes.COLOR,
        },
      ]);
    });

    it('var operator with type hint', () => {
      const result = expressionToGlsl(
        context,
        ['var', 'color'],
        ValueTypes.COLOR
      );
      expect(result).to.eql('u_var_color');
      expect(context.variables).to.eql([
        {
          name: 'color',
          type: ValueTypes.COLOR,
        },
      ]);
    });

    it('get and var operators, numbers', function () {
      context.style.variables['myVar'] = 123;
      context.style.variables['myVar2'] = 456;
      expressionToGlsl(context, ['get', 'myAttr']);
      expressionToGlsl(context, ['var', 'myVar']);
      expressionToGlsl(context, [
        'clamp',
        ['get', 'attr2'],
        ['get', 'attr2'],
        ['get', 'myAttr'],
      ]);
      expressionToGlsl(context, ['*', ['get', 'attr2'], ['var', 'myVar']]);
      expressionToGlsl(context, ['*', ['get', 'attr3'], ['var', 'myVar2']]);
      expect(context.attributes).to.eql([
        {name: 'myAttr', type: ValueTypes.NUMBER},
        {name: 'attr2', type: ValueTypes.NUMBER},
        {name: 'attr3', type: ValueTypes.NUMBER},
      ]);
      expect(context.variables).to.eql([
        {name: 'myVar', type: ValueTypes.NUMBER},
        {name: 'myVar2', type: ValueTypes.NUMBER},
      ]);
    });

    it('get and var operators, nested, color and number', () => {
      expressionToGlsl(
        context,
        [
          'interpolate',
          ['linear'],
          ['get', 'intensity'],
          0,
          ['get', 'low_color'],
          1,
          ['get', 'high_color'],
        ],
        ValueTypes.COLOR
      );
      expect(context.attributes).to.eql([
        {
          name: 'intensity',
          type: ValueTypes.NUMBER,
        },
        {
          name: 'low_color',
          type: ValueTypes.COLOR,
        },
        {
          name: 'high_color',
          type: ValueTypes.COLOR,
        },
      ]);
      expect(context.variables).to.eql([]);
    });

    it('get and var operators, nested, string and number array', () => {
      expressionToGlsl(
        context,
        [
          'case',
          ['==', ['var', 'symbolType'], 'dynamic'],
          [
            'array',
            [
              'match',
              ['get', 'type'],
              'low',
              ['var', 'lowHeight'],
              'medium',
              ['var', 'mediumHeight'],
              ['get', 'height'],
            ],
            10,
          ],
          ['var', 'fixedSize'],
        ],
        ValueTypes.ANY
      );
      expect(context.attributes).to.eql([
        {
          name: 'type',
          type: ValueTypes.STRING,
        },
        {
          name: 'height',
          type: ValueTypes.NUMBER,
        },
      ]);
      expect(context.variables).to.eql([
        {
          name: 'fixedSize',
          type: ValueTypes.NUMBER_ARRAY,
        },
        {
          name: 'symbolType',
          type: ValueTypes.STRING,
        },
        {
          name: 'mediumHeight',
          type: ValueTypes.NUMBER,
        },
        {
          name: 'lowHeight',
          type: ValueTypes.NUMBER,
        },
      ]);
    });

    it('var and get operators, nested, boolean and color', () => {
      expressionToGlsl(
        context,
        [
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
        ValueTypes.COLOR
      );
      expect(context.attributes).to.eql([
        {name: 'validValue', type: ValueTypes.BOOLEAN},
      ]);
      expect(context.variables).to.eql([
        {name: 'selected', type: ValueTypes.BOOLEAN},
        {name: 'newColor', type: ValueTypes.COLOR},
        {name: 'oldColor', type: ValueTypes.COLOR},
      ]);
    });

    it('throws when an attribute is used with conflicting types', () => {
      expect(() =>
        expressionToGlsl(
          context,
          [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0,
            ['get', 'intensity'],
            1,
            'red',
          ],
          ValueTypes.COLOR
        )
      ).to.throwException();
    });

    it('throws when a variable is used with conflicting types', () => {
      expect(() =>
        expressionToGlsl(
          context,
          [
            'interpolate',
            ['linear'],
            ['var', 'intensity'],
            0,
            ['var', 'intensity'],
            1,
            'red',
          ],
          ValueTypes.COLOR
        )
      ).to.throwException();
    });

    it('throws if a variable is used with the wrong type', () => {
      expect(() =>
        expressionToGlsl(context, ['var', 'oldColor'], ValueTypes.NUMBER)
      ).to.throwError(/No matching type/);
    });

    it('throws if a type ambiguity remains when using a variable', () => {
      expect(() =>
        expressionToGlsl(context, ['var', 'oldColor'], ValueTypes.ANY)
      ).to.throwError(/unique type/);
    });

    it('throws a variable initial value is null', () => {
      context.style.variables.oldColor = null;
      expect(() =>
        expressionToGlsl(context, ['var', 'oldColor'], ValueTypes.COLOR)
      ).to.throwError(/Unhandled value type/);
    });
  });
});
