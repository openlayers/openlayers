import {
  arrayToGlsl, colorToGlsl,
  expressionToGlsl,
  getValueType,
  numberToGlsl,
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
      context = {};
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
      expect(expressionToGlsl(context, ['interpolate', ['get', 'attr4'], [255, 255, 255, 1], 'transparent'])).to.eql(
        'mix(vec4(1.0, 1.0, 1.0, 1.0), vec4(0.0, 0.0, 0.0, 0.0), a_attr4)');
    });

  });

});
