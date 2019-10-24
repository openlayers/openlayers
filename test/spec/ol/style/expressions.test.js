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

  });

});
