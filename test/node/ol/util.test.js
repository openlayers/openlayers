import {assert} from 'chai';
import {getUid, isThenable} from '../../../src/ol/util.js';

describe('ol/util.js', () => {
  describe('getUid()', function () {
    it('is constant once generated', function () {
      const a = {};
      assert.strictEqual(getUid(a), getUid(a));
    });

    it('generates a strictly increasing sequence', function () {
      const a = {};
      const b = {};
      const c = {};
      getUid(a);
      getUid(c);
      getUid(b);

      assert.isBelow(Number(getUid(a)), Number(getUid(c)));
      assert.isBelow(Number(getUid(c)), Number(getUid(b)));
      assert.isBelow(Number(getUid(a)), Number(getUid(b)));
    });
  });

  describe('isThenable()', () => {
    it('is true for a native promise', () => {
      assert.isTrue(isThenable(Promise.resolve('a value')));
    });

    it('is true for the return value of an async function', () => {
      const asyncFunction = async () => 'a value';
      assert.isTrue(isThenable(asyncFunction()));
    });

    it('is true for a custom thenable', () => {
      assert.isTrue(isThenable({then: () => {}, catch: () => {}}));
    });

    it('is false for non-thenable values', () => {
      assert.isFalse(isThenable({}));
      assert.isFalse(isThenable(null));
      assert.isFalse(isThenable(undefined));
      assert.isFalse(isThenable(0));
      assert.isFalse(isThenable(42));
      assert.isFalse(isThenable(''));
      assert.isFalse(isThenable('a value'));
      assert.isFalse(isThenable(() => {}));
      assert.isFalse(isThenable([]));
    });
  });
});
