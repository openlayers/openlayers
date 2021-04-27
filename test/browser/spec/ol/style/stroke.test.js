import Stroke from '../../../../../src/ol/style/Stroke.js';

describe('ol.style.Stroke', function () {
  describe('#clone', function () {
    it('creates a new ol.style.Stroke', function () {
      const original = new Stroke();
      const clone = original.clone();
      expect(clone).to.be.an(Stroke);
      expect(clone).to.not.be(original);
    });

    it('copies all values', function () {
      const original = new Stroke({
        color: '#319FD3',
        lineCap: 'square',
        lineJoin: 'miter',
        lineDash: [1, 2, 3],
        lineDashOffset: 2,
        miterLimit: 20,
        width: 5,
      });
      const clone = original.clone();
      expect(original.getColor()).to.eql(clone.getColor());
      expect(original.getLineCap()).to.eql(clone.getLineCap());
      expect(original.getLineJoin()).to.eql(clone.getLineJoin());
      expect(original.getLineDash()).to.eql(clone.getLineDash());
      expect(original.getLineDashOffset()).to.eql(clone.getLineDashOffset());
      expect(original.getMiterLimit()).to.eql(clone.getMiterLimit());
      expect(original.getWidth()).to.eql(clone.getWidth());
    });

    it('the clone does not reference the same objects as the original', function () {
      const original = new Stroke({
        color: [1, 2, 3, 0.4],
        lineDash: [1, 2, 3],
      });
      const clone = original.clone();
      expect(original.getColor()).to.not.be(clone.getColor());
      expect(original.getLineDash()).to.not.be(clone.getLineDash());

      clone.getColor()[0] = 0;
      clone.getLineDash()[0] = 0;
      expect(original.getColor()).to.not.eql(clone.getColor());
      expect(original.getLineDash()).to.not.eql(clone.getLineDash());
    });
  });
});
