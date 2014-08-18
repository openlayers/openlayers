goog.provide('ol.test.ol');

describe('ol', function() {

  describe('lives in ol namespace', function() {
    expect(ol).not.to.be(undefined);
    expect(ol).to.be.a(Object);
  });

  describe('is versioned', function() {

    it('has version-attribute', function() {
      expect(ol.version).not.to.be(undefined);
    });

    it('has a version starting with "v3"', function() {
      expect(/^v3/.test(ol.version)).to.be(true);
    });

  });

});


goog.require('ol');
