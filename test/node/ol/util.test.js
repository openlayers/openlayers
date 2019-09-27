import {assert} from 'chai';
import {getUid} from '../../../src/ol/util.js';

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
});
