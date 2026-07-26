import {assert} from 'chai';
import {memoizeOne, toPromise} from '../../../src/ol/functions.js';

describe('ol/functions.js', function () {
  describe('toPromise()', () => {
    it('returns a promise given a getter for a value', async () => {
      const getter = () => 'a value';
      const promise = toPromise(getter);
      assert.instanceOf(promise, Promise);
      assert.strictEqual(await promise, 'a value');
    });

    it('returns a promise given a getter for a promise that resolves', async () => {
      const getter = () => Promise.resolve('a value');
      const promise = toPromise(getter);
      assert.instanceOf(promise, Promise);
      assert.strictEqual(await promise, 'a value');
    });

    it('returns a promise that rejects given a getter that throws', async () => {
      const getter = () => {
        throw new Error('an error');
      };
      const promise = toPromise(getter);
      assert.instanceOf(promise, Promise);
      let error;
      try {
        await promise;
      } catch (err) {
        error = err;
      }
      assert.instanceOf(error, Error);
      assert.strictEqual(error.message, 'an error');
    });

    it('returns a promise that rejects given a getter for a promse that rejects', async () => {
      const getter = () => Promise.reject(new Error('an error'));
      const promise = toPromise(getter);
      assert.instanceOf(promise, Promise);
      let error;
      try {
        await promise;
      } catch (err) {
        error = err;
      }
      assert.instanceOf(error, Error);
      assert.strictEqual(error.message, 'an error');
    });
  });

  describe('memoizeOne()', function () {
    it('returns the result from the first call when called a second time with the same args', function () {
      const arg1 = {};
      const arg2 = {};
      const arg3 = {};
      function call(a1, a2, a3) {
        return {};
      }
      const memoized = memoizeOne(call);
      const result = memoized(arg1, arg2, arg3);
      assert.strictEqual(memoized(arg1, arg2, arg3), result);
    });

    it('returns the result from the first call when called a second time with the same this object', function () {
      const arg1 = {};
      const arg2 = {};
      const arg3 = {};
      function call(a1, a2, a3) {
        return {};
      }
      const memoized = memoizeOne(call);

      const thisObj = {};

      const result = memoized.call(thisObj, arg1, arg2, arg3);
      assert.strictEqual(memoized.call(thisObj, arg1, arg2, arg3), result);
    });

    it('returns a different result when called a second time with the different args', function () {
      const arg1 = {};
      const arg2 = {};
      const arg3 = {};
      function call(a1, a2, a3) {
        return {};
      }
      const memoized = memoizeOne(call);
      const result = memoized(arg1, arg2, arg3);
      assert.notEqual(memoized(arg3, arg2, arg1), result);
    });

    it('returns a different result when called a second time with a different this object', function () {
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
      assert.notEqual(memoized.call(secondThis, arg1, arg2, arg3), result);
    });
  });
});
