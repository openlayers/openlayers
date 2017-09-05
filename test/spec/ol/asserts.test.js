

import _ol_asserts_ from '../../../src/ol/asserts';


describe('ol.asserts', function() {

  describe('ol.asserts.assert', function() {
    it('throws an exception', function() {
      expect(function() {
        _ol_asserts_.assert(false, 42);
      }).to.throwException();
    });
  });

});
