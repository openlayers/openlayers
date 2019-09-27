import {assert} from 'chai';
import {assert as olAssert} from '../../../src/ol/asserts.js';

describe('ol/asserts.js', function () {
  describe('assert', function () {
    it('throws an exception', function () {
      assert.throws(function () {
        olAssert(false, 'This should fail');
      });
    });
  });
});
