import {getValueType, ValueTypes} from '../../../../src/ol/style/expressions.js';


describe('ol.style.expressions', function() {

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

});
