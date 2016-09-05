goog.provide('ol.test.style.Fill');

goog.require('ol.style.Fill');

describe('ol.style.Fill', function() {

  describe('#clone', function() {

    it('creates a new ol.style.Fill', function() {
      var original = new ol.style.Fill();
      var clone = original.clone();
      expect(clone instanceof ol.style.Fill).to.eql(true);
      expect(clone).to.not.be(original);
    });

    it('clones all values', function() {
      var original = new ol.style.Fill({
        color: '#319FD3'
      });
      var clone = original.clone();
      expect(original.getColor()).to.eql(clone.getColor());
    });
  });
});
