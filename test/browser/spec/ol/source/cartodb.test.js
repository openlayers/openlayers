import {assert} from 'chai';
import CartoDB from '../../../../../src/ol/source/CartoDB.js';
import XYZ from '../../../../../src/ol/source/XYZ.js';

describe('ol.source.CartoDB', function () {
  describe('constructor', function () {
    it('returns a CartoDB source', function () {
      const source = new CartoDB({
        account: 'documentation',
        config: {},
      });
      assert.instanceOf(source, XYZ);
      assert.instanceOf(source, CartoDB);
    });
  });
});
