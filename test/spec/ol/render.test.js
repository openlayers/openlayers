import {equals} from '../../../src/ol/array.js';
import {DEVICE_PIXEL_RATIO} from '../../../src/ol/has.js';
import {toContext} from '../../../src/ol/render.js';
import CanvasImmediateRenderer from '../../../src/ol/render/canvas/Immediate.js';
import {scale as scaleTransform, create as createTransform} from '../../../src/ol/transform.js';


describe('ol.render', () => {

  describe('toContext', () => {

    test('creates an ol.render.canvas.Immediate and sets defaults', () => {
      const canvas = document.createElement('canvas');
      const render = toContext(canvas.getContext('2d'));
      expect(render).toBeInstanceOf(CanvasImmediateRenderer);
      expect(render.pixelRatio_).toBe(DEVICE_PIXEL_RATIO);
    });

    test('sets size and pixel ratio from options', () => {
      const canvas = document.createElement('canvas');
      const pixelRatio = 1.5;
      const size = [100, 50];
      const render = toContext(canvas.getContext('2d'),
        {pixelRatio: pixelRatio, size: size});
      expect(render.pixelRatio_).toBe(pixelRatio);
      expect(render.extent_).toEqual([0, 0, size[0] * pixelRatio, size[1] * pixelRatio]);
      expect(canvas.style.width).toBe(size[0] + 'px');
      expect(canvas.style.height).toBe(size[1] + 'px');
      const transform = scaleTransform(createTransform(),
        pixelRatio, pixelRatio);
      expect(equals(render.transform_, transform)).toBeTruthy();
    });
  });

});
