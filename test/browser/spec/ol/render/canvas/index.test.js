import {assert} from 'chai';
import {spy as sinonSpy} from 'sinon';
import * as render from '../../../../../../src/ol/render/canvas.js';

describe('ol.render.canvas', function () {
  const font = document.createElement('link');
  font.href =
    'https://fonts.googleapis.com/css?family=Abel&text=wmytzilWMYTZIL%40%23%2F%26%3F%24%2510';
  font.rel = 'stylesheet';

  describe('ol.render.canvas.registerFont()', function () {
    beforeEach(function () {
      render.checkedFonts.setProperties({}, true);
      render.measureTextHeight('12px sans-serif');
    });

    const retries = 100;

    it('does not trigger redraw and clear measurements for unavailable fonts', function (done) {
      const spy = sinonSpy();
      render.checkedFonts.addEventListener('propertychange', spy);
      const interval = setInterval(function () {
        if (render.checkedFonts.get('normal 400 16px "foo"') == retries) {
          clearInterval(interval);
          render.checkedFonts.removeEventListener('propertychange', spy);
          assert.strictEqual(spy.callCount, 0);
          assert.notDeepEqual(render.textHeights, {});
          done();
        }
      }, 100);
      render.registerFont('12px foo,sans-serif');
    });

    it('does not trigger redraw and clear measurements for available fonts', function (done) {
      const spy = sinonSpy();
      render.checkedFonts.addEventListener('propertychange', spy);
      setTimeout(function () {
        render.checkedFonts.removeEventListener('propertychange', spy);
        assert.strictEqual(spy.callCount, 0);
        assert.notDeepEqual(render.textHeights, {});
        done();
      }, 1000);
      render.registerFont('12px sans-serif');
    });

    it("does not trigger redraw and clear measurements for the 'monospace' font", function (done) {
      const spy = sinonSpy();
      render.checkedFonts.addEventListener('propertychange', spy);
      setInterval(function () {
        render.checkedFonts.removeEventListener('propertychange', spy);
        assert.strictEqual(spy.callCount, 0);
        assert.notDeepEqual(render.textHeights, {});
        done();
      }, 1000);
      render.registerFont('12px monospace');
    });

    it('triggers redraw and clear measurements for fonts that become available', function (done) {
      document.head.appendChild(font);
      render.checkedFonts.addEventListener(
        'propertychange',
        function onPropertyChange(e) {
          render.checkedFonts.removeEventListener(
            'propertychange',
            onPropertyChange,
          );
          try {
            assert.strictEqual(e.key, 'normal 400 16px "Abel"');
            assert.deepEqual(render.textHeights, {});

            font.remove();
            render.checkedFonts.setProperties({}, true);
            done();
          } catch (err) {
            done(err);
          }
        },
      );
      render.registerFont('12px Abel');
    });
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
        translate: sinonSpy(),
        rotate: sinonSpy(),
      };
      render.rotateAtOffset(context, Math.PI, 10, 10);
      assert.strictEqual(context.translate.callCount, 2);
      assert.deepEqual(context.translate.firstCall.args, [10, 10]);
      assert.deepEqual(context.translate.secondCall.args, [-10, -10]);
      assert.strictEqual(context.rotate.callCount, 1);
      assert.deepEqual(context.rotate.firstCall.args, [Math.PI]);
    });
  });

  describe('drawImageOrLabel', function () {
    it('draws the image with correct parameters', function () {
      const layerContext = {
        save: sinonSpy(),
        transform: sinonSpy(),
        drawImage: sinonSpy(),
        restore: sinonSpy(),
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

      assert.strictEqual(layerContext.save.callCount, 1);
      assert.strictEqual(layerContext.transform.callCount, 1);
      assert.deepEqual(layerContext.transform.firstCall.args, transform);
      assert.strictEqual(layerContext.drawImage.callCount, 1);
      assert.strictEqual(layerContext.globalAlpha, 0.5);
      assert.strictEqual(layerContext.restore.callCount, 1);
    });
  });
});
