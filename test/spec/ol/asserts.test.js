goog.provide('ol.asserts.asserts.test');

goog.require('ol.asserts');


describe('ol.asserts', function() {

  describe('ol.asserts.assert', function() {
    it('throws an exception', function() {
      expect(function() {
        ol.asserts.assert(false, 42);
      }).to.throwException();
    });
  });

});
