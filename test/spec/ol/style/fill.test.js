import Fill from '../../../../src/ol/style/Fill.js';

describe('ol.style.Fill', () => {

  describe('#clone', () => {

    test('creates a new ol.style.Fill', () => {
      const original = new Fill();
      const clone = original.clone();
      expect(clone).toBeInstanceOf(Fill);
      expect(clone).not.toBe(original);
    });

    test('copies all values', () => {
      const original = new Fill({
        color: '#319FD3'
      });
      const clone = original.clone();
      expect(original.getColor()).toEqual(clone.getColor());
    });

    test(
      'the clone does not reference the same objects as the original',
      () => {
        const original = new Fill({
          color: [63, 255, 127, 0.7]
        });
        const clone = original.clone();
        expect(original.getColor()).not.toBe(clone.getColor());

        clone.getColor()[2] = 0;
        expect(original.getColor()).not.toEqual(clone.getColor());
      }
    );

  });
});
