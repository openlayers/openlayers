import {assert} from 'chai';
import {equals} from '../../../../src/ol/array.js';
import {DEVICE_PIXEL_RATIO} from '../../../../src/ol/has.js';
import {toContext} from '../../../../src/ol/render.js';
import CanvasImmediateRenderer from '../../../../src/ol/render/canvas/Immediate.js';
import {
  create as createTransform,
  scale as scaleTransform,
} from '../../../../src/ol/transform.js';

describe('ol.render', function () {
  describe('toContext', function () {
    it('creates an ol.render.canvas.Immediate and sets defaults', function () {
      const canvas = document.createElement('canvas');
      const render = toContext(canvas.getContext('2d'));
      assert.instanceOf(render, CanvasImmediateRenderer);
      assert.strictEqual(render.pixelRatio_, DEVICE_PIXEL_RATIO);
    });

    it('sets size and pixel ratio from options', function () {
      const canvas = document.createElement('canvas');
      const pixelRatio = 1.5;
      const size = [100, 50];
      const render = toContext(canvas.getContext('2d'), {
        pixelRatio: pixelRatio,
        size: size,
      });
      assert.strictEqual(render.pixelRatio_, pixelRatio);
      assert.deepEqual(render.extent_, [
        0,
        0,
        size[0] * pixelRatio,
        size[1] * pixelRatio,
      ]);
      assert.strictEqual(canvas.style.width, size[0] + 'px');
      assert.strictEqual(canvas.style.height, size[1] + 'px');
      const transform = scaleTransform(
        createTransform(),
        pixelRatio,
        pixelRatio,
      );
      assert.isOk(equals(render.transform_, transform));
    });
  });
});
