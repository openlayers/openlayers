import Fill from '../../../../../src/ol/style/Fill.js';
import {getUid} from '../../../../../src/ol/util.js';

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
  describe('#getKey', () => {
    it('generates a key for an rgba color', () => {
      const fill = new Fill({
        color: [63, 255, 127, 0.7],
      });
      expect(fill.getKey()).to.eql('63,255,127,0.7');
    });
    it('generates a key for a hex color', () => {
      const fill = new Fill({
        color: '#00FF00',
      });
      expect(fill.getKey()).to.eql('0,255,0,1');
    });
    it('generates a key for a pattern descriptor', () => {
      const fill = new Fill({
        color: {
          src: '/base/spec/ol/data/dot.png',
        },
      });
      expect(fill.getKey()).to.eql('/base/spec/ol/data/dot.png:undefined');
    });
    it('generates a key for a CanvasGradient', () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const gradient = context.createLinearGradient(0, 0, 1024, 0);
      const fill = new Fill({
        color: gradient,
      });
      expect(fill.getKey()).to.eql(getUid(gradient));
    });
  });
});
