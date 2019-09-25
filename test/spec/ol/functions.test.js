import {memoizeOne} from '../../../src/ol/functions.js';


describe('ol/functions', () => {

  describe('memoizeOne()', () => {
    test(
      'returns the result from the first call when called a second time with the same args',
      () => {
        const arg1 = {};
        const arg2 = {};
        const arg3 = {};
        function call(a1, a2, a3) {
          return {};
        }
        const memoized = memoizeOne(call);
        const result = memoized(arg1, arg2, arg3);
        expect(memoized(arg1, arg2, arg3)).toBe(result);
      }
    );

    test(
      'returns the result from the first call when called a second time with the same this object',
      () => {
        const arg1 = {};
        const arg2 = {};
        const arg3 = {};
        function call(a1, a2, a3) {
          return {};
        }
        const memoized = memoizeOne(call);

        const thisObj = {};

        const result = memoized.call(thisObj, arg1, arg2, arg3);
        expect(memoized.call(thisObj, arg1, arg2, arg3)).toBe(result);
      }
    );

    test(
      'returns a different result when called a second time with the different args',
      () => {
        const arg1 = {};
        const arg2 = {};
        const arg3 = {};
        function call(a1, a2, a3) {
          return {};
        }
        const memoized = memoizeOne(call);
        const result = memoized(arg1, arg2, arg3);
        expect(memoized(arg3, arg2, arg1)).not.toBe(result);
      }
    );

    test(
      'returns a different result when called a second time with a different this object',
      () => {
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
        expect(memoized.call(secondThis, arg1, arg2, arg3)).not.toBe(result);
      }
    );
  });

});
