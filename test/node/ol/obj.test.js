import {assert} from 'chai';
import {clear, isEmpty} from '../../../src/ol/obj.js';

describe('ol/obj.js', () => {
  describe('clear()', function () {
    it('removes all properties from an object', function () {
      assert.strictEqual(isEmpty(clear({foo: 'bar'})), true);
      assert.strictEqual(isEmpty(clear({foo: 'bar', num: 42})), true);
      assert.strictEqual(isEmpty(clear({})), true);
      assert.strictEqual(isEmpty(clear(null)), true);
    });
  });

  describe('isEmpty()', function () {
    it('checks if an object has any properties', function () {
      assert.strictEqual(isEmpty({}), true);
      assert.strictEqual(isEmpty(null), true);
      assert.strictEqual(isEmpty({foo: 'bar'}), false);
      assert.strictEqual(isEmpty({foo: false}), false);
    });
  });
});
