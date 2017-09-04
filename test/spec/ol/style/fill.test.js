

goog.require('ol.style.Fill');

describe('ol.style.Fill', function() {

  describe('#clone', function() {

    it('creates a new ol.style.Fill', function() {
      var original = new ol.style.Fill();
      var clone = original.clone();
      expect(clone).to.be.an(ol.style.Fill);
      expect(clone).to.not.be(original);
    });

    it('copies all values', function() {
      var original = new ol.style.Fill({
        color: '#319FD3'
      });
      var clone = original.clone();
      expect(original.getColor()).to.eql(clone.getColor());
    });

    it('the clone does not reference the same objects as the original', function() {
      var original = new ol.style.Fill({
        color: [63, 255, 127, 0.7]
      });
      var clone = original.clone();
      expect(original.getColor()).to.not.be(clone.getColor());

      clone.getColor()[2] = 0;
      expect(original.getColor()).to.not.eql(clone.getColor());
    });

  });
});
