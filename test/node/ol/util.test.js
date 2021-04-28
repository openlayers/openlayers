import expect from '../expect.js';
import {getUid} from '../../../src/ol/util.js';

describe('ol/util.js', () => {
  describe('getUid()', function () {
    it('is constant once generated', function () {
      const a = {};
      expect(getUid(a)).to.be(getUid(a));
    });

    it('generates a strictly increasing sequence', function () {
      const a = {};
      const b = {};
      const c = {};
      getUid(a);
      getUid(c);
      getUid(b);

      // uid order should be a < c < b
      expect(getUid(a)).to.be.lessThan(getUid(c));
      expect(getUid(c)).to.be.lessThan(getUid(b));
      expect(getUid(a)).to.be.lessThan(getUid(b));
    });
  });
});
