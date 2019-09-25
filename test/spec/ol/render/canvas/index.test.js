import {clear} from '../../../../../src/ol/obj.js';
import * as render from '../../../../../src/ol/render/canvas.js';


describe('ol.render.canvas', () => {

  const font = document.createElement('link');
  font.href = 'https://fonts.googleapis.com/css?family=Abel&text=wmytzilWMYTZIL%40%23%2F%26%3F%24%2510';
  font.rel = 'stylesheet';
  const head = document.getElementsByTagName('head')[0];

  describe('ol.render.canvas.checkFont()', () => {

    beforeEach(() => {
      clear(render.checkedFonts);
      render.measureTextHeight('12px sans-serif');
    });

    const retries = 100;

    test(
      'does not clear label cache and measurements for unavailable fonts',
      done => {
        this.timeout(4000);
        const spy = sinon.spy();
        render.labelCache.addEventListener('clear', spy);
        const interval = setInterval(function() {
          if (render.checkedFonts['normal\nnormal\nfoo'] == retries && render.checkedFonts['normal\nnormal\nsans-serif'] == retries) {
            clearInterval(interval);
            render.labelCache.removeEventListener('clear', spy);
            expect(spy.callCount).toBe(0);
            expect(render.textHeights).not.toEqual({});
            done();
          }
        }, 32);
        render.checkFont('12px foo,sans-serif');
      }
    );

    test(
      'does not clear label cache and measurements for available fonts',
      done => {
        const spy = sinon.spy();
        render.labelCache.addEventListener('clear', spy);
        const interval = setInterval(function() {
          if (render.checkedFonts['normal\nnormal\nsans-serif'] == retries) {
            clearInterval(interval);
            render.labelCache.removeEventListener('clear', spy);
            expect(spy.callCount).toBe(0);
            expect(render.textHeights).not.toEqual({});
            done();
          }
        }, 32);
        render.checkFont('12px sans-serif');
      }
    );

    test(
      'does not clear label cache and measurements for the \'monospace\' font',
      done => {
        const spy = sinon.spy();
        render.labelCache.addEventListener('clear', spy);
        const interval = setInterval(function() {
          if (render.checkedFonts['normal\nnormal\nmonospace'] == retries) {
            clearInterval(interval);
            render.labelCache.removeEventListener('clear', spy);
            expect(spy.callCount).toBe(0);
            expect(render.textHeights).not.toEqual({});
            done();
          }
        }, 32);
        render.checkFont('12px monospace');
      }
    );

    test(
      'clears label cache and measurements for fonts that become available',
      done => {
        head.appendChild(font);
        render.labelCache.set('dummy', {});
        render.labelCache.addEventListener('clear', function() {
          expect(render.textHeights).toEqual({});
          done();
        });
        render.checkFont('12px Abel');
      }
    );

  });

  describe('measureTextHeight', () => {
    test('respects line-height', () => {
      const height = render.measureTextHeight('12px/1.2 sans-serif');
      expect(render.measureTextHeight('12px/2.4 sans-serif')).toBeGreaterThan(height);
      expect(render.measureTextHeight('12px/0.1 sans-serif')).toBeLessThan(height);
    });
  });


  describe('rotateAtOffset', () => {
    test('rotates a canvas at an offset point', () => {
      const context = {
        translate: sinon.spy(),
        rotate: sinon.spy()
      };
      render.rotateAtOffset(context, Math.PI, 10, 10);
      expect(context.translate.callCount).toBe(2);
      expect(context.translate.firstCall.args).toEqual([10, 10]);
      expect(context.translate.secondCall.args).toEqual([-10, -10]);
      expect(context.rotate.callCount).toBe(1);
      expect(context.rotate.firstCall.args).toEqual([Math.PI]);
    });
  });

});
