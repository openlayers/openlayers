import {
  arrayToGlsl, colorToGlsl,
  expressionToGlsl,
  getValueType, isTypeUnique,
  numberToGlsl, stringToGlsl,
  ValueTypes
} from '../../../../src/ol/style/expressions.js';


describe('ol.style.expressions', function() {

  describe('numberToGlsl', function() {
    it('does a simple transform when a fraction is present', function() {
      expect(numberToGlsl(1.3456)).to.eql('1.3456');
    });
    it('adds a fraction separator when missing', function() {
      expect(numberToGlsl(1)).to.eql('1.0');
      expect(numberToGlsl(2.0)).to.eql('2.0');
    });
  });

  describe('arrayToGlsl', function() {
    it('outputs numbers with dot separators', function() {
      expect(arrayToGlsl([1, 0, 3.45, 0.8888])).to.eql('vec4(1.0, 0.0, 3.45, 0.8888)');
      expect(arrayToGlsl([3, 4])).to.eql('vec2(3.0, 4.0)');
    });
    it('throws on invalid lengths', function() {
      let thrown = false;
      try {
        arrayToGlsl([3]);
      } catch (e) {
        thrown = true;
      }
      try {
        arrayToGlsl([3, 2, 1, 0, -1]);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(true);
    });
  });

  describe('colorToGlsl', function() {
    it('normalizes color and outputs numbers with dot separators', function() {
      expect(colorToGlsl([100, 0, 255])).to.eql('vec4(0.39215686274509803, 0.0, 1.0, 1.0)');
      expect(colorToGlsl([100, 0, 255, 1])).to.eql('vec4(0.39215686274509803, 0.0, 1.0, 1.0)');
    });
    it('handles colors in string format', function() {
      expect(colorToGlsl('red')).to.eql('vec4(1.0, 0.0, 0.0, 1.0)');
      expect(colorToGlsl('#00ff99')).to.eql('vec4(0.0, 1.0, 0.6, 1.0)');
      expect(colorToGlsl('rgb(100, 0, 255)')).to.eql('vec4(0.39215686274509803, 0.0, 1.0, 1.0)');
      expect(colorToGlsl('rgba(100, 0, 255, 0.3)')).to.eql('vec4(0.39215686274509803, 0.0, 1.0, 0.3)');
    });
  });

  describe('stringToGlsl', function() {
    let context;
    beforeEach(function() {
      context = {
        stringLiteralsMap: {}
      };
    });

    it('maps input string to stable numbers', function() {
      expect(stringToGlsl(context, 'abcd')).to.eql('0.0');
      expect(stringToGlsl(context, 'defg')).to.eql('1.0');
      expect(stringToGlsl(context, 'hijk')).to.eql('2.0');
      expect(stringToGlsl(context, 'abcd')).to.eql('0.0');
      expect(stringToGlsl(context, 'def')).to.eql('3.0');
    });
  });

  describe('isTypeUnique', function() {
    it('return true if only one value type', function() {
      expect(isTypeUnique(ValueTypes.NUMBER)).to.eql(true);
      expect(isTypeUnique(ValueTypes.STRING)).to.eql(true);
      expect(isTypeUnique(ValueTypes.COLOR)).to.eql(true);
    });
    it('return false if several value types', function() {
      expect(isTypeUnique(ValueTypes.NUMBER | ValueTypes.COLOR)).to.eql(false);
      expect(isTypeUnique(ValueTypes.ANY)).to.eql(false);
    });
    it('return false if no value type', function() {
      expect(isTypeUnique(ValueTypes.NUMBER & ValueTypes.COLOR)).to.eql(false);
    });
  });

  describe('getValueType', function() {

    it('correctly analyzes a literal value', function() {
      expect(getValueType(1234)).to.eql(ValueTypes.NUMBER);
      expect(getValueType([1, 2, 3, 4])).to.eql(ValueTypes.COLOR | ValueTypes.NUMBER_ARRAY);
      expect(getValueType([1, 2, 3])).to.eql(ValueTypes.COLOR | ValueTypes.NUMBER_ARRAY);
      expect(getValueType([1, 2])).to.eql(ValueTypes.NUMBER_ARRAY);
      expect(getValueType([1, 2, 3, 4, 5])).to.eql(ValueTypes.NUMBER_ARRAY);
      expect(getValueType('yellow')).to.eql(ValueTypes.COLOR | ValueTypes.STRING);
      expect(getValueType('#113366')).to.eql(ValueTypes.COLOR | ValueTypes.STRING);
      expect(getValueType('rgba(252,171,48,0.62)')).to.eql(ValueTypes.COLOR | ValueTypes.STRING);
      expect(getValueType('abcd')).to.eql(ValueTypes.STRING);
      expect(getValueType(true)).to.eql(ValueTypes.BOOLEAN);
    });

    it('throws on an unsupported type (object)', function(done) {
      try {
        getValueType(new Object());
      } catch (e) {
        done();
      }
      done(true);
    });

    it('throws on an unsupported type (mixed array)', function(done) {
      try {
        getValueType([1, true, 'aa']);
      } catch (e) {
        done();
      }
      done(true);
    });

    it('correctly analyzes operator return types', function() {
      expect(getValueType(['get', 'myAttr'])).to.eql(ValueTypes.ANY);
      expect(getValueType(['var', 'myValue'])).to.eql(ValueTypes.ANY);
      expect(getValueType(['time'])).to.eql(ValueTypes.NUMBER);
      expect(getValueType(['+', ['get', 'size'], 12])).to.eql(ValueTypes.NUMBER);
      expect(getValueType(['-', ['get', 'size'], 12])).to.eql(ValueTypes.NUMBER);
      expect(getValueType(['/', ['get', 'size'], 12])).to.eql(ValueTypes.NUMBER);
      expect(getValueType(['*', ['get', 'size'], 12])).to.eql(ValueTypes.NUMBER);
      expect(getValueType(['clamp', ['get', 'attr2'], ['get', 'attr3'], 20])).to.eql(ValueTypes.NUMBER);
      expect(getValueType(['stretch', ['get', 'size'], 10, 100, 4, 8])).to.eql(ValueTypes.NUMBER);
      expect(getValueType(['pow', 10, 2])).to.eql(ValueTypes.NUMBER);
      expect(getValueType(['mod', ['time'], 10])).to.eql(ValueTypes.NUMBER);
      expect(getValueType(['>', 10, ['get', 'attr4']])).to.eql(ValueTypes.BOOLEAN);
      expect(getValueType(['>=', 10, ['get', 'attr4']])).to.eql(ValueTypes.BOOLEAN);
      expect(getValueType(['<', 10, ['get', 'attr4']])).to.eql(ValueTypes.BOOLEAN);
      expect(getValueType(['<=', 10, ['get', 'attr4']])).to.eql(ValueTypes.BOOLEAN);
      expect(getValueType(['==', 10, ['get', 'attr4']])).to.eql(ValueTypes.BOOLEAN);
      expect(getValueType(['between', ['get', 'attr4'], -4.0, 5.0])).to.eql(ValueTypes.BOOLEAN);
      expect(getValueType(['!', ['get', 'attr4']])).to.eql(ValueTypes.BOOLEAN);
      expect(getValueType(['interpolate', ['get', 'attr4'], [255, 255, 255, 1], 'transparent'])).to.eql(ValueTypes.COLOR);
    });

  });

  describe('expressionToGlsl', function() {
    let context;

    beforeEach(function() {
      context = {
        variables: [],
        attributes: [],
        stringLiteralsMap: {}
      };
    });

    it('correctly converts expressions to GLSL', function() {
      expect(expressionToGlsl(context, ['get', 'myAttr'])).to.eql('a_myAttr');
      expect(expressionToGlsl(context, ['var', 'myValue'])).to.eql('u_myValue');
      expect(expressionToGlsl(context, ['time'])).to.eql('u_time');
      expect(expressionToGlsl(context, ['+', ['*', ['get', 'size'], 0.001], 12])).to.eql('((a_size * 0.001) + 12.0)');
      expect(expressionToGlsl(context, ['/', ['-', ['get', 'size'], 20], 100])).to.eql('((a_size - 20.0) / 100.0)');
      expect(expressionToGlsl(context, ['clamp', ['get', 'attr2'], ['get', 'attr3'], 20])).to.eql('clamp(a_attr2, a_attr3, 20.0)');
      expect(expressionToGlsl(context, ['stretch', ['get', 'size'], 10, 100, 4, 8])).to.eql('((clamp(a_size, 10.0, 100.0) - 10.0) * ((8.0 - 4.0) / (100.0 - 10.0)) + 4.0)');
      expect(expressionToGlsl(context, ['pow', ['mod', ['time'], 10], 2])).to.eql('pow(mod(u_time, 10.0), 2.0)');
      expect(expressionToGlsl(context, ['>', 10, ['get', 'attr4']])).to.eql('(10.0 > a_attr4)');
      expect(expressionToGlsl(context, ['>=', 10, ['get', 'attr4']])).to.eql('(10.0 >= a_attr4)');
      expect(expressionToGlsl(context, ['<', 10, ['get', 'attr4']])).to.eql('(10.0 < a_attr4)');
      expect(expressionToGlsl(context, ['<=', 10, ['get', 'attr4']])).to.eql('(10.0 <= a_attr4)');
      expect(expressionToGlsl(context, ['==', 10, ['get', 'attr4']])).to.eql('(10.0 == a_attr4)');
      expect(expressionToGlsl(context, ['between', ['get', 'attr4'], -4.0, 5.0])).to.eql('(a_attr4 >= -4.0 && a_attr4 <= 5.0)');
      expect(expressionToGlsl(context, ['!', ['get', 'attr4']])).to.eql('(!a_attr4)');
    });

    it('correctly adapts output for fragment shaders', function() {
      context.inFragmentShader = true;
      expect(expressionToGlsl(context, ['get', 'myAttr'])).to.eql('v_myAttr');
    });

    it('correctly adapts output for fragment shaders', function() {
      expressionToGlsl(context, ['get', 'myAttr']);
      expressionToGlsl(context, ['var', 'myVar']);
      expressionToGlsl(context, ['clamp', ['get', 'attr2'], ['get', 'attr2'], ['get', 'myAttr']]);
      expressionToGlsl(context, ['*', ['get', 'attr2'], ['var', 'myVar']]);
      expressionToGlsl(context, ['*', ['get', 'attr3'], ['var', 'myVar2']]);
      expect(context.attributes).to.eql(['myAttr', 'attr2', 'attr3']);
      expect(context.variables).to.eql(['myVar', 'myVar2']);
    });

    it('gives precedence to the string type unless asked otherwise', function() {
      expect(expressionToGlsl(context, 'lightgreen')).to.eql('0.0');
      expect(expressionToGlsl(context, 'lightgreen', ValueTypes.COLOR)).to.eql(
        'vec4(0.5647058823529412, 0.9333333333333333, 0.5647058823529412, 1.0)');
    });

    it('throws on unsupported types for operators', function() {
      let thrown = false;
      try {
        expressionToGlsl(context, ['var', 1234]);
      } catch (e) {
        thrown = true;
      }
      try {
        expressionToGlsl(context, ['<', 0, 'aa']);
      } catch (e) {
        thrown = true;
      }
      try {
        expressionToGlsl(context, ['+', true, ['get', 'attr']]);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(true);
    });

    it('throws with the wrong number of arguments', function() {
      let thrown = false;
      try {
        expressionToGlsl(context, ['var', 1234, 456]);
      } catch (e) {
        thrown = true;
      }
      try {
        expressionToGlsl(context, ['<', 4]);
      } catch (e) {
        thrown = true;
      }
      try {
        expressionToGlsl(context, ['+']);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(true);
    });

    it('throws on invalid expressions', function() {
      let thrown = false;
      try {
        expressionToGlsl(context, true);
      } catch (e) {
        thrown = true;
      }
      try {
        expressionToGlsl(context, [123, 456]);
      } catch (e) {
        thrown = true;
      }
      try {
        expressionToGlsl(context, null);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(true);
    });
  });

  describe('match operator', function() {
    let context;

    beforeEach(function() {
      context = {
        variables: [],
        attributes: [],
        stringLiteralsMap: {}
      };
    });

    it('correctly guesses the output type', function() {
      expect(getValueType(['match', ['get', 'attr'], 0, 'red', 1, 'yellow', 'green']))
        .to.eql(ValueTypes.STRING | ValueTypes.COLOR);
      expect(getValueType(['match', ['get', 'attr'], 0, 'not_a_color', 1, 'yellow', 'green']))
        .to.eql(ValueTypes.STRING);
      expect(getValueType(['match', ['get', 'attr'], 0, 'red', 1, 'yellow', 'not_a_color']))
        .to.eql(ValueTypes.STRING);
      expect(getValueType(['match', ['get', 'attr'], 0, [1, 1, 0], 1, [1, 0, 1], [0, 1, 1]]))
        .to.eql(ValueTypes.COLOR | ValueTypes.NUMBER_ARRAY);
      expect(getValueType(['match', ['get', 'attr'], 0, [1, 1, 0], 1, [1, 0, 1], 'white']))
        .to.eql(ValueTypes.COLOR);
      expect(getValueType(['match', ['get', 'attr'], 0, 'red', 1, true, 100]))
        .to.eql(ValueTypes.NONE);
      expect(getValueType(['match', ['get', 'attr'], 0, false, 1, true, false]))
        .to.eql(ValueTypes.BOOLEAN);
      expect(getValueType(['match', ['get', 'attr'], 0, 100, 1, 200, 300]))
        .to.eql(ValueTypes.NUMBER);
    });

    it('throws if no single output type could be inferred', function() {
      let thrown = false;
      try {
        expressionToGlsl(context, ['match', ['get', 'attr'], 0, 'red', 1, 'yellow', 'green'], ValueTypes.COLOR);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(false);

      try {
        expressionToGlsl(context, ['match', ['get', 'attr'], 0, 'red', 1, 'yellow', 'green']);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(true);

      thrown = false;
      try {
        expressionToGlsl(context, ['match', ['get', 'attr'], 0, 'red', 1, 'yellow', 'green'], ValueTypes.NUMBER);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(true);
    });

    it('throws if invalid argument count', function() {
      let thrown = false;
      try {
        expressionToGlsl(context, ['match', ['get', 'attr'], 0, true, false, false]);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(true);

      thrown = false;
      try {
        expressionToGlsl(context, ['match', ['get', 'attr'], 0, true]);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(true);

      try {
        expressionToGlsl(context, ['match', ['get', 'attr'], 0]);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(true);
    });

    it('correctly parses the expression (colors)', function() {
      expect(expressionToGlsl(context, ['match', ['get', 'attr'], 0, 'red', 1, 'yellow', 'white'], ValueTypes.COLOR))
        .to.eql('(a_attr == 0.0 ? vec4(1.0, 0.0, 0.0, 1.0) : (a_attr == 1.0 ? vec4(1.0, 1.0, 0.0, 1.0) : vec4(1.0, 1.0, 1.0, 1.0)))');
    });

    it('correctly parses the expression (strings)', function() {
      function toGlsl(string) {
        return stringToGlsl(context, string);
      }
      expect(expressionToGlsl(context, ['match', ['get', 'attr'], 10, 'red', 20, 'yellow', 'white'], ValueTypes.STRING))
        .to.eql(`(a_attr == 10.0 ? ${toGlsl('red')} : (a_attr == 20.0 ? ${toGlsl('yellow')} : ${toGlsl('white')}))`);
    });

    it('correctly parses the expression (number arrays)', function() {
      function toGlsl(string) {
        return stringToGlsl(context, string);
      }
      expect(expressionToGlsl(context, ['match', ['get', 'attr'], 'low', [0, 0], 'high', [0, 1], [1, 0]]))
        .to.eql(`(a_attr == ${toGlsl('low')} ? vec2(0.0, 0.0) : (a_attr == ${toGlsl('high')} ? vec2(0.0, 1.0) : vec2(1.0, 0.0)))`);
      expect(expressionToGlsl(context, ['match', ['get', 'attr'], 0, [0, 0, 1, 1], 1, [1, 1, 2, 2], 2, [2, 2, 3, 3], [3, 3, 4, 4]], ValueTypes.NUMBER_ARRAY))
        .to.eql('(a_attr == 0.0 ? vec4(0.0, 0.0, 1.0, 1.0) : (a_attr == 1.0 ? vec4(1.0, 1.0, 2.0, 2.0) : (a_attr == 2.0 ? vec4(2.0, 2.0, 3.0, 3.0) : vec4(3.0, 3.0, 4.0, 4.0))))');
    });

  });

  describe('interpolate operator', function() {
    let context;

    beforeEach(function() {
      context = {
        variables: [],
        attributes: [],
        stringLiteralsMap: {}
      };
    });

    it('correctly guesses the output type', function() {
      expect(getValueType(['interpolate', ['linear'], ['get', 'attr'], 0, 'red', 100, 'yellow']))
        .to.eql(ValueTypes.COLOR);
      expect(getValueType(['interpolate', ['linear'], ['get', 'attr'], 0, [1, 2, 3], 1, [0, 0, 0, 4]]))
        .to.eql(ValueTypes.COLOR);
      expect(getValueType(['interpolate', ['linear'], ['get', 'attr'], 1000, -10, 2000, 10]))
        .to.eql(ValueTypes.NUMBER);
    });

    it('throws if no single output type could be inferred', function() {
      let thrown = false;
      try {
        expressionToGlsl(context, ['interpolate', ['linear'], ['get', 'attr'], 1000, -10, 2000, 10], ValueTypes.COLOR);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(true);

      try {
        expressionToGlsl(context, ['interpolate', ['linear'], ['get', 'attr'], 0, [1, 2, 3], 1, 222]);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(true);

      thrown = false;
      try {
        expressionToGlsl(context, ['interpolate', ['linear'], ['get', 'attr'], 0, [1, 2, 3], 1, [0, 0, 0, 4]], ValueTypes.NUMBER);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(true);
    });

    it('throws if invalid argument count', function() {
      let thrown = false;
      try {
        expressionToGlsl(context, ['interpolate', ['linear'], ['get', 'attr'], 1000]);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(true);

      thrown = false;
      try {
        expressionToGlsl(context, ['interpolate', ['linear'], ['get', 'attr'], 1000, -10, 2000, 10, 5000]);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(true);
    });

    it('throws if an invalid interpolation type is given', function() {
      let thrown = false;
      try {
        expressionToGlsl(context, ['interpolate', 'linear', ['get', 'attr'], 1000, 0, 2000, 1]);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(true);

      thrown = false;
      try {
        expressionToGlsl(context, ['interpolate', ['exponential'], ['get', 'attr'], 1000, -10, 2000, 1]);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(true);

      thrown = false;
      try {
        expressionToGlsl(context, ['interpolate', ['not_a_type'], ['get', 'attr'], 1000, -10, 2000, 1]);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).to.be(true);
    });

    it('correctly parses the expression (colors, linear)', function() {
      expect(expressionToGlsl(context,
        ['interpolate', ['linear'], ['get', 'attr'], 1000, [255, 0, 0], 2000, [0, 255, 0]]
      )).to.eql(
        'mix(vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 1.0, 0.0, 1.0), pow(clamp((a_attr - 1000.0) / (2000.0 - 1000.0), 0.0, 1.0), 1.0))');
      expect(expressionToGlsl(context,
        ['interpolate', ['linear'], ['get', 'attr'], 1000, [255, 0, 0], 2000, [0, 255, 0], 5000, [0, 0, 255]]
      )).to.eql(
        'mix(mix(vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 1.0, 0.0, 1.0), pow(clamp((a_attr - 1000.0) / (2000.0 - 1000.0), 0.0, 1.0), 1.0)), vec4(0.0, 0.0, 1.0, 1.0), pow(clamp((a_attr - 2000.0) / (5000.0 - 2000.0), 0.0, 1.0), 1.0))');
    });

    it('correctly parses the expression (number, linear)', function() {
      expect(expressionToGlsl(context,
        ['interpolate', ['linear'], ['get', 'attr'], 1000, -10, 2000, 0, 5000, 10]
      )).to.eql(
        'mix(mix(-10.0, 0.0, pow(clamp((a_attr - 1000.0) / (2000.0 - 1000.0), 0.0, 1.0), 1.0)), 10.0, pow(clamp((a_attr - 2000.0) / (5000.0 - 2000.0), 0.0, 1.0), 1.0))');
    });

    it('correctly parses the expression (number, exponential)', function() {
      expect(expressionToGlsl(context,
        ['interpolate', ['exponential', 0.5], ['get', 'attr'], 1000, -10, 2000, 0, 5000, 10]
      )).to.eql(
        'mix(mix(-10.0, 0.0, pow(clamp((a_attr - 1000.0) / (2000.0 - 1000.0), 0.0, 1.0), 0.5)), 10.0, pow(clamp((a_attr - 2000.0) / (5000.0 - 2000.0), 0.0, 1.0), 0.5))');
    });

  });

  describe('complex expressions', function() {
    let context;

    beforeEach(function() {
      context = {
        variables: [],
        attributes: [],
        stringLiteralsMap: {}
      };
    });

    it('correctly parses a combination of interpolate, match, color and number', function() {
      const expression = ['interpolate',
        ['pow',
          ['/',
            ['mod',
              ['+',
                ['time'],
                ['stretch', ['get', 'year'], 1850, 2020, 0, 8]
              ],
              8
            ],
            8
          ],
          0.5
        ],
        'rgba(242,56,22,0.61)',
        ['match',
          ['get', 'year'],
          2000, 'green',
          '#ffe52c'
        ]
      ];
      expect(expressionToGlsl(context, expression)).to.eql(
        'mix(vec4(0.9490196078431372, 0.2196078431372549, 0.08627450980392157, 0.61), (a_year == 2000.0 ? vec4(0.0, 0.5019607843137255, 0.0, 1.0) : vec4(1.0, 0.8980392156862745, 0.17254901960784313, 1.0)), pow((mod((u_time + ((clamp(a_year, 1850.0, 2020.0) - 1850.0) * ((8.0 - 0.0) / (2020.0 - 1850.0)) + 0.0)), 8.0) / 8.0), 0.5))'
      );
    });
  });
});
