goog.provide('ol.test.functions');

describe('ol.functions', function() {

  describe('ol.functions.TRUE', function() {

    it('returns true', function() {
      expect(ol.functions.TRUE()).to.be(true);
    });

  });

  describe('ol.functions.TRUE', function() {

    it('returns false', function() {
      expect(ol.functions.FALSE()).to.be(false);
    });

  });

  describe('ol.functions.NULL', function() {

    it('returns null', function() {
      expect(ol.functions.NULL()).to.be(null);
    });

  });

  describe('ol.functions.and', function() {
    //TODO
    it('returns null', function() {
      expect(ol.functions.NULL()).to.be(null);
    });

  });

  describe('ol.functions.sequence', function() {
    //TODO
    it('returns null', function() {
      expect(ol.functions.NULL()).to.be(null);
    });

  });

  describe('ol.functions.identity', function() {

    it('returns first argument', function() {
      expect(ol.functions.identity()).to.be(undefined);
      expect(ol.functions.identity('Test')).to.be('Test');
      expect(ol.functions.identity('Test', 'Not')).to.be('Test');

    });

  });

});

goog.require('ol.functions');
