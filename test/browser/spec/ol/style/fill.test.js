import {assert} from 'chai';
import Fill from '../../../../../src/ol/style/Fill.js';
import {getUid} from '../../../../../src/ol/util.js';

describe('ol.style.Fill', function () {
  describe('#clone', function () {
    it('creates a new ol.style.Fill', function () {
      const original = new Fill();
      const clone = original.clone();
      assert.instanceOf(clone, Fill);
      assert.notEqual(clone, original);
    });

    it('copies all values', function () {
      const original = new Fill({
        color: '#319FD3',
      });
      const clone = original.clone();
      assert.deepEqual(original.getColor(), clone.getColor());
    });

    it('the clone does not reference the same objects as the original', function () {
      const original = new Fill({
        color: [63, 255, 127, 0.7],
      });
      const clone = original.clone();
      assert.notEqual(original.getColor(), clone.getColor());

      clone.getColor()[2] = 0;
      assert.notDeepEqual(original.getColor(), clone.getColor());
    });
  });
  describe('#getKey', () => {
    it('generates a key for an rgba color', () => {
      const fill = new Fill({
        color: [63, 255, 127, 0.7],
      });
      assert.deepEqual(fill.getKey(), '63,255,127,0.7');
    });
    it('generates a key for a hex color', () => {
      const fill = new Fill({
        color: '#00FF00',
      });
      assert.deepEqual(fill.getKey(), '0,255,0,1');
    });
    it('generates a key for a pattern descriptor', () => {
      const fill = new Fill({
        color: {
          src: '/base/spec/ol/data/dot.png',
        },
      });
      assert.deepEqual(fill.getKey(), '/base/spec/ol/data/dot.png:undefined');
    });
    it('generates a key for a CanvasGradient', () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const gradient = context.createLinearGradient(0, 0, 1024, 0);
      const fill = new Fill({
        color: gradient,
      });
      assert.deepEqual(fill.getKey(), getUid(gradient));
    });
  });
});
