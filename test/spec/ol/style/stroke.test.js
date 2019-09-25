import Stroke from '../../../../src/ol/style/Stroke.js';

describe('ol.style.Stroke', () => {

  describe('#clone', () => {

    test('creates a new ol.style.Stroke', () => {
      const original = new Stroke();
      const clone = original.clone();
      expect(clone).toBeInstanceOf(Stroke);
      expect(clone).not.toBe(original);
    });

    test('copies all values', () => {
      const original = new Stroke({
        color: '#319FD3',
        lineCap: 'square',
        lineJoin: 'miter',
        lineDash: [1, 2, 3],
        lineDashOffset: 2,
        miterLimit: 20,
        width: 5
      });
      const clone = original.clone();
      expect(original.getColor()).toEqual(clone.getColor());
      expect(original.getLineCap()).toEqual(clone.getLineCap());
      expect(original.getLineJoin()).toEqual(clone.getLineJoin());
      expect(original.getLineDash()).toEqual(clone.getLineDash());
      expect(original.getLineDashOffset()).toEqual(clone.getLineDashOffset());
      expect(original.getMiterLimit()).toEqual(clone.getMiterLimit());
      expect(original.getWidth()).toEqual(clone.getWidth());
    });

    test(
      'the clone does not reference the same objects as the original',
      () => {
        const original = new Stroke({
          color: [1, 2, 3, 0.4],
          lineDash: [1, 2, 3]
        });
        const clone = original.clone();
        expect(original.getColor()).not.toBe(clone.getColor());
        expect(original.getLineDash()).not.toBe(clone.getLineDash());

        clone.getColor()[0] = 0;
        clone.getLineDash()[0] = 0;
        expect(original.getColor()).not.toEqual(clone.getColor());
        expect(original.getLineDash()).not.toEqual(clone.getLineDash());
      }
    );
  });

});
