goog.provide('ol.test.style.Stroke');

goog.require('ol.style.Stroke');

describe('ol.style.Stroke', function() {

  describe('#clone', function() {

    it('creates a new ol.style.Stroke', function() {
      var original = new ol.style.Stroke();
      var clone = original.clone();
      expect(clone instanceof ol.style.Stroke).to.eql(true);
      expect(clone).to.not.be(original);
    });

    it('clones all values', function() {
      var original = new ol.style.Stroke({
        color: '#319FD3',
        lineCap: 'square',
        lineJoin: 'miter',
        lineDash: [1,2,3],
        miterLimit: 20,
        width: 5
      });
      var clone = original.clone();
      expect(original.getColor()).to.eql(clone.getColor());
      expect(original.getLineCap()).to.be(clone.getLineCap());
      expect(original.getLineJoin()).to.be(clone.getLineJoin());
      expect(original.getLineDash()).not.to.be(clone.getLineDash());
      expect(original.getLineDash()).to.eql(clone.getLineDash());
      expect(original.getMiterLimit()).to.be(clone.getMiterLimit());
      expect(original.getWidth()).to.be(clone.getWidth());
    });
  });
});
