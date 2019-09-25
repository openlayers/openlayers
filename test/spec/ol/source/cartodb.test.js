import CartoDB from '../../../../src/ol/source/CartoDB.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

describe('ol.source.CartoDB', () => {

  describe('constructor', () => {
    test('returns a CartoDB source', () => {
      const source = new CartoDB({
        account: 'documentation',
        config: {}
      });
      expect(source).toBeInstanceOf(XYZ);
      expect(source).toBeInstanceOf(CartoDB);
    });
  });
});
