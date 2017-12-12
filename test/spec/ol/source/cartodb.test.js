import _ol_source_CartoDB_ from '../../../../src/ol/source/CartoDB.js';
import _ol_source_XYZ_ from '../../../../src/ol/source/XYZ.js';

describe('ol.source.CartoDB', function() {

  describe('constructor', function() {
    it('returns a CartoDB source', function() {
      var source = new _ol_source_CartoDB_({
        account: 'documentation',
        config: {}
      });
      expect(source).to.be.a(_ol_source_XYZ_);
      expect(source).to.be.a(_ol_source_CartoDB_);
    });
  });
});
