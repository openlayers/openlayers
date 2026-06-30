import {assert} from 'chai';
import * as render from '../../../../../../src/ol/render/canvas.js';
import {createFontStyle} from '../../../util.js';

describe('ol.render.canvas', function () {
  const localFontFamily = 'Ubuntu - CanvasIndexTest';
  const font = createFontStyle({
    fontFamily: localFontFamily,
    src: {
      url: '/spec/ol/data/fonts/ubuntu-regular-webfont.woff2',
      format: 'woff2',
    },
  });

  describe('ol.render.canvas.registerFont()', function () {
    beforeEach(() => {
      render.checkedFonts.setProperties({}, true);
      render.measureTextHeight('12px sans-serif');
    });

    const retries = 100;

    it('does not trigger redraw and clear measurements for unavailable fonts', () =>
      new Promise((resolve) => {
        const spy = vi.fn();
        render.checkedFonts.addEventListener('propertychange', spy);
        const interval = setInterval(function () {
          if (render.checkedFonts.get('normal 400 16px "foo"') == retries) {
            clearInterval(interval);
            render.checkedFonts.removeEventListener('propertychange', spy);
            assert.strictEqual(spy.mock.calls.length, 0);
            assert.notDeepEqual(render.textHeights, {});
            resolve();
          }
        }, 100);
        render.registerFont('12px foo,sans-serif');
      }));

    it('does not trigger redraw and clear measurements for available fonts', () =>
      new Promise((resolve) => {
        const spy = vi.fn();
        render.checkedFonts.addEventListener('propertychange', spy);
        setTimeout(function () {
          render.checkedFonts.removeEventListener('propertychange', spy);
          assert.strictEqual(spy.mock.calls.length, 0);
          assert.notDeepEqual(render.textHeights, {});
          resolve();
        }, 1000);
        render.registerFont('12px sans-serif');
      }));

    it("does not trigger redraw and clear measurements for the 'monospace' font", () =>
      new Promise((resolve) => {
        const spy = vi.fn();
        render.checkedFonts.addEventListener('propertychange', spy);
        setInterval(function () {
          render.checkedFonts.removeEventListener('propertychange', spy);
          assert.strictEqual(spy.mock.calls.length, 0);
          assert.notDeepEqual(render.textHeights, {});
          resolve();
        }, 1000);
        render.registerFont('12px monospace');
      }));

    it('triggers redraw and clear measurements for fonts that become available', () =>
      new Promise((resolve, reject) => {
        font.add();
        render.checkedFonts.addEventListener(
          'propertychange',
          function onPropertyChange(e) {
            render.checkedFonts.removeEventListener(
              'propertychange',
              onPropertyChange,
            );
            try {
              assert.strictEqual(e.key, `normal 400 16px "${localFontFamily}"`);
              assert.deepEqual(render.textHeights, {});

              font.remove();
              resolve();
            } catch (err) {
              reject(err);
              return;
            }
          },
        );
        render.registerFont(`12px "${localFontFamily}"`);
      }));
  });

  describe('measureTextHeight', function () {
    it('respects line-height', function () {
      const height = render.measureTextHeight('12px/1.2 sans-serif');
      assert.isAbove(render.measureTextHeight('12px/2.4 sans-serif'), height);
      assert.isBelow(render.measureTextHeight('12px/0.1 sans-serif'), height);
    });
  });

  describe('rotateAtOffset', function () {
    it('rotates a canvas at an offset point', function () {
      const context = {
        translate: vi.fn(),
        rotate: vi.fn(),
      };
      render.rotateAtOffset(context, Math.PI, 10, 10);
      assert.strictEqual(context.translate.mock.calls.length, 2);
      assert.deepEqual(context.translate.mock.calls[0], [10, 10]);
      assert.deepEqual(context.translate.mock.calls[1], [-10, -10]);
      assert.strictEqual(context.rotate.mock.calls.length, 1);
      assert.deepEqual(context.rotate.mock.calls[0], [Math.PI]);
    });
  });

  describe('drawImageOrLabel', function () {
    it('draws the image with correct parameters', function () {
      const layerContext = {
        save: vi.fn(),
        transform: vi.fn(),
        drawImage: vi.fn(),
        restore: vi.fn(),
        globalAlpha: 1,
      };
      const transform = [1, 0, 0, 1, 0, 0];
      const opacity = 0.5;
      const image = {};
      const x = 0;
      const y = 0;
      const w = 1;
      const h = 1;
      const scale = 1;

      render.drawImageOrLabel(
        layerContext,
        transform.slice(),
        opacity,
        image,
        x,
        y,
        w,
        h,
        x,
        y,
        scale,
      );

      assert.strictEqual(layerContext.save.mock.calls.length, 1);
      assert.strictEqual(layerContext.transform.mock.calls.length, 1);
      assert.deepEqual(layerContext.transform.mock.calls[0], transform);
      assert.strictEqual(layerContext.drawImage.mock.calls.length, 1);
      assert.strictEqual(layerContext.globalAlpha, 0.5);
      assert.strictEqual(layerContext.restore.mock.calls.length, 1);
    });
  });
});
