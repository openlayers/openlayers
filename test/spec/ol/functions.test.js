import {memoizeOne} from '../../../src/ol/functions.js';


describe('ol/functions', function() {

  describe('memoizeOne()', function() {
    it('returns the result from the first call when called a second time with the same args', function() {
      const arg1 = {};
      const arg2 = {};
      const arg3 = {};
      function call(a1, a2, a3) {
        return {};
      }
      const memoized = memoizeOne(call);
      const result = memoized(arg1, arg2, arg3);
      expect(memoized(arg1, arg2, arg3)).to.be(result);
    });

    it('returns the result from the first call when called a second time with the same this object', function() {
      const arg1 = {};
      const arg2 = {};
      const arg3 = {};
      function call(a1, a2, a3) {
        return {};
      }
      const memoized = memoizeOne(call);

      const thisObj = {};

      const result = memoized.call(thisObj, arg1, arg2, arg3);
      expect(memoized.call(thisObj, arg1, arg2, arg3)).to.be(result);
    });

    it('returns a different result when called a second time with the different args', function() {
      const arg1 = {};
      const arg2 = {};
      const arg3 = {};
      function call(a1, a2, a3) {
        return {};
      }
      const memoized = memoizeOne(call);
      const result = memoized(arg1, arg2, arg3);
      expect(memoized(arg3, arg2, arg1)).not.to.be(result);
    });

    it('returns a different result when called a second time with a different this object', function() {
      const arg1 = {};
      const arg2 = {};
      const arg3 = {};
      function call(a1, a2, a3) {
        return {};
      }
      const firstThis = {};
      const secondThis = {};
      const memoized = memoizeOne(call);
      const result = memoized.call(firstThis, arg1, arg2, arg3);
      expect(memoized.call(secondThis, arg1, arg2, arg3)).not.to.be(result);
    });
  });

});
