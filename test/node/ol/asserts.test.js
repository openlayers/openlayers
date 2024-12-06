import {assert} from '../../../src/ol/asserts.js';
import expect from '../expect.js';

describe('ol/asserts.js', function () {
  describe('assert', function () {
    it('throws an exception', function () {
      expect(function () {
        assert(false, 'This should fail');
      }).to.throwException();
    });
  });
});
