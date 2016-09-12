goog.provide('ol.test.style.Stroke');

goog.require('ol.style.Stroke');

describe('ol.style.Stroke', function() {

  describe('#clone', function() {

    it('creates a new ol.style.Stroke', function() {
      var original = new ol.style.Stroke();
      var clone = original.clone();
      expect(clone).to.be.an(ol.style.Stroke);
      expect(clone).to.not.be(original);
    });

    it('copies all values', function() {
      var original = new ol.style.Stroke({
        color: '#319FD3',
        lineCap: 'square',
        lineJoin: 'miter',
        lineDash: [1, 2, 3],
        miterLimit: 20,
        width: 5
      });
      var clone = original.clone();
      expect(original.getColor()).to.eql(clone.getColor());
      expect(original.getLineCap()).to.eql(clone.getLineCap());
      expect(original.getLineJoin()).to.eql(clone.getLineJoin());
      expect(original.getLineDash()).to.eql(clone.getLineDash());
      expect(original.getMiterLimit()).to.eql(clone.getMiterLimit());
      expect(original.getWidth()).to.eql(clone.getWidth());
    });

    it('the clone does not reference the same objects as the original', function() {
      var original = new ol.style.Stroke({
        color: [1, 2, 3, 0.4],
        lineDash: [1, 2, 3]
      });
      var clone = original.clone();
      expect(original.getColor()).to.not.be(clone.getColor());
      expect(original.getLineDash()).to.not.be(clone.getLineDash());

      clone.getColor()[0] = 0;
      clone.getLineDash()[0] = 0;
      expect(original.getColor()).to.not.eql(clone.getColor());
      expect(original.getLineDash()).to.not.eql(clone.getLineDash());
    });
  });

});
