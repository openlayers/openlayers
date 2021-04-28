import CanvasImmediateRenderer from '../../../../src/ol/render/canvas/Immediate.js';
import {DEVICE_PIXEL_RATIO} from '../../../../src/ol/has.js';
import {
  create as createTransform,
  scale as scaleTransform,
} from '../../../../src/ol/transform.js';
import {equals} from '../../../../src/ol/array.js';
import {toContext} from '../../../../src/ol/render.js';

describe('ol.render', function () {
  describe('toContext', function () {
    it('creates an ol.render.canvas.Immediate and sets defaults', function () {
      const canvas = document.createElement('canvas');
      const render = toContext(canvas.getContext('2d'));
      expect(render).to.be.a(CanvasImmediateRenderer);
      expect(render.pixelRatio_).to.be(DEVICE_PIXEL_RATIO);
    });

    it('sets size and pixel ratio from options', function () {
      const canvas = document.createElement('canvas');
      const pixelRatio = 1.5;
      const size = [100, 50];
      const render = toContext(canvas.getContext('2d'), {
        pixelRatio: pixelRatio,
        size: size,
      });
      expect(render.pixelRatio_).to.be(pixelRatio);
      expect(render.extent_).to.eql([
        0,
        0,
        size[0] * pixelRatio,
        size[1] * pixelRatio,
      ]);
      expect(canvas.style.width).to.be(size[0] + 'px');
      expect(canvas.style.height).to.be(size[1] + 'px');
      const transform = scaleTransform(
        createTransform(),
        pixelRatio,
        pixelRatio
      );
      expect(equals(render.transform_, transform)).to.be.ok();
    });
  });
});
