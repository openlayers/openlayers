import {assert} from 'chai';
import Stroke from '../../../../../src/ol/style/Stroke.js';

describe('ol.style.Stroke', function () {
  describe('#clone', function () {
    it('creates a new ol.style.Stroke', function () {
      const original = new Stroke();
      const clone = original.clone();
      assert.instanceOf(clone, Stroke);
      assert.notEqual(clone, original);
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
      assert.deepEqual(original.getColor(), clone.getColor());
      assert.deepEqual(original.getLineCap(), clone.getLineCap());
      assert.deepEqual(original.getLineJoin(), clone.getLineJoin());
      assert.deepEqual(original.getLineDash(), clone.getLineDash());
      assert.deepEqual(original.getLineDashOffset(), clone.getLineDashOffset());
      assert.deepEqual(original.getMiterLimit(), clone.getMiterLimit());
      assert.deepEqual(original.getWidth(), clone.getWidth());
    });

    it('the clone does not reference the same objects as the original', function () {
      const original = new Stroke({
        color: [1, 2, 3, 0.4],
        lineDash: [1, 2, 3],
      });
      const clone = original.clone();
      assert.notEqual(original.getColor(), clone.getColor());
      assert.notEqual(original.getLineDash(), clone.getLineDash());

      clone.getColor()[0] = 0;
      clone.getLineDash()[0] = 0;
      assert.notDeepEqual(original.getColor(), clone.getColor());
      assert.notDeepEqual(original.getLineDash(), clone.getLineDash());
    });
  });
});
