import CartoDB from '../../../../../src/ol/source/CartoDB.js';
import XYZ from '../../../../../src/ol/source/XYZ.js';

describe('ol.source.CartoDB', function () {
  describe('constructor', function () {
    it('returns a CartoDB source', function () {
      const source = new CartoDB({
        account: 'documentation',
        config: {},
      });
      expect(source).to.be.a(XYZ);
      expect(source).to.be.a(CartoDB);
    });
  });
});
