import Fill from '../../../../../src/ol/style/Fill.js';

describe('ol.style.Fill', function () {
  describe('#clone', function () {
    it('creates a new ol.style.Fill', function () {
      const original = new Fill();
      const clone = original.clone();
      expect(clone).to.be.an(Fill);
      expect(clone).to.not.be(original);
    });

    it('copies all values', function () {
      const original = new Fill({
        color: '#319FD3',
      });
      const clone = original.clone();
      expect(original.getColor()).to.eql(clone.getColor());
    });

    it('the clone does not reference the same objects as the original', function () {
      const original = new Fill({
        color: [63, 255, 127, 0.7],
      });
      const clone = original.clone();
      expect(original.getColor()).to.not.be(clone.getColor());

      clone.getColor()[2] = 0;
      expect(original.getColor()).to.not.eql(clone.getColor());
    });
  });
});
