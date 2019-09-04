import {clear} from '../../../../../src/ol/obj.js';
import * as render from '../../../../../src/ol/render/canvas.js';


describe('ol.render.canvas', function() {

  const font = document.createElement('link');
  font.href = 'https://fonts.googleapis.com/css?family=Abel&text=wmytzilWMYTZIL%40%23%2F%26%3F%24%2510';
  font.rel = 'stylesheet';
  const head = document.getElementsByTagName('head')[0];

  describe('ol.render.canvas.checkFont()', function() {

    beforeEach(function() {
      clear(render.checkedFonts);
      render.measureTextHeight('12px sans-serif');
    });

    const retries = 100;

    it('does not clear label cache and measurements for unavailable fonts', function(done) {
      this.timeout(4000);
      const spy = sinon.spy();
      render.labelCache.addEventListener('clear', spy);
      const interval = setInterval(function() {
        if (render.checkedFonts['normal\nnormal\nfoo'] == retries && render.checkedFonts['normal\nnormal\nsans-serif'] == retries) {
          clearInterval(interval);
          render.labelCache.removeEventListener('clear', spy);
          expect(spy.callCount).to.be(0);
          expect(render.textHeights).to.not.eql({});
          done();
        }
      }, 32);
      render.checkFont('12px foo,sans-serif');
    });

    it('does not clear label cache and measurements for available fonts', function(done) {
      const spy = sinon.spy();
      render.labelCache.addEventListener('clear', spy);
      const interval = setInterval(function() {
        if (render.checkedFonts['normal\nnormal\nsans-serif'] == retries) {
          clearInterval(interval);
          render.labelCache.removeEventListener('clear', spy);
          expect(spy.callCount).to.be(0);
          expect(render.textHeights).to.not.eql({});
          done();
        }
      }, 32);
      render.checkFont('12px sans-serif');
    });

    it('does not clear label cache and measurements for the \'monospace\' font', function(done) {
      const spy = sinon.spy();
      render.labelCache.addEventListener('clear', spy);
      const interval = setInterval(function() {
        if (render.checkedFonts['normal\nnormal\nmonospace'] == retries) {
          clearInterval(interval);
          render.labelCache.removeEventListener('clear', spy);
          expect(spy.callCount).to.be(0);
          expect(render.textHeights).to.not.eql({});
          done();
        }
      }, 32);
      render.checkFont('12px monospace');
    });

    it('clears label cache and measurements for fonts that become available', function(done) {
      head.appendChild(font);
      render.labelCache.set('dummy', {});
      render.labelCache.addEventListener('clear', function() {
        expect(render.textHeights).to.eql({});
        done();
      });
      render.checkFont('12px Abel');
    });

  });

  describe('measureTextHeight', function() {
    it('respects line-height', function() {
      const height = render.measureTextHeight('12px/1.2 sans-serif');
      expect(render.measureTextHeight('12px/2.4 sans-serif')).to.be.greaterThan(height);
      expect(render.measureTextHeight('12px/0.1 sans-serif')).to.be.lessThan(height);
    });
  });


  describe('rotateAtOffset', function() {
    it('rotates a canvas at an offset point', function() {
      const context = {
        translate: sinon.spy(),
        rotate: sinon.spy()
      };
      render.rotateAtOffset(context, Math.PI, 10, 10);
      expect(context.translate.callCount).to.be(2);
      expect(context.translate.firstCall.args).to.eql([10, 10]);
      expect(context.translate.secondCall.args).to.eql([-10, -10]);
      expect(context.rotate.callCount).to.be(1);
      expect(context.rotate.firstCall.args).to.eql([Math.PI]);
    });
  });

});
