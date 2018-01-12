import _ol_events_ from '../../../../../src/ol/events.js';
import _ol_obj_ from '../../../../../src/ol/obj.js';
import _ol_render_canvas_ from '../../../../../src/ol/render/canvas.js';


describe('ol.render.canvas', function() {

  const font = document.createElement('link');
  font.href = 'https://fonts.googleapis.com/css?family=Abel&text=wmytzilWMYTZIL%40%23%2F%26%3F%24%2510';
  font.rel = 'stylesheet';
  const head = document.getElementsByTagName('head')[0];

  describe('ol.render.canvas.checkFont()', function() {

    beforeEach(function() {
      _ol_obj_.clear(_ol_render_canvas_.checkedFonts_);
      _ol_render_canvas_.getMeasureContext();
      _ol_render_canvas_.measureTextHeight('12px sans-serif');
    });

    const checkFont = _ol_render_canvas_.checkFont;
    const retries = 60;

    it('does not clear label cache and measurements for unavailable fonts', function(done) {
      this.timeout(3000);
      const spy = sinon.spy();
      _ol_events_.listen(_ol_render_canvas_.labelCache, 'clear', spy);
      const interval = setInterval(function() {
        if (_ol_render_canvas_.checkedFonts_['foo'] == retries && _ol_render_canvas_.checkedFonts_['sans-serif'] == retries) {
          clearInterval(interval);
          _ol_events_.unlisten(_ol_render_canvas_.labelCache, 'clear', spy);
          expect(spy.callCount).to.be(0);
          expect(_ol_render_canvas_.measureContext_).to.not.be(null);
          expect(_ol_render_canvas_.textHeights_).to.not.eql({});
          done();
        }
      }, 32);
      checkFont('12px foo,sans-serif');
    });

    it('does not clear label cache and measurements for available fonts', function(done) {
      const spy = sinon.spy();
      _ol_events_.listen(_ol_render_canvas_.labelCache, 'clear', spy);
      const interval = setInterval(function() {
        if (_ol_render_canvas_.checkedFonts_['sans-serif'] == retries) {
          clearInterval(interval);
          _ol_events_.unlisten(_ol_render_canvas_.labelCache, 'clear', spy);
          expect(spy.callCount).to.be(0);
          expect(_ol_render_canvas_.measureContext_).to.not.be(null);
          expect(_ol_render_canvas_.textHeights_).to.not.eql({});
          done();
        }
      }, 32);
      checkFont('12px sans-serif');
    });

    it('does not clear label cache and measurements for the \'monospace\' font', function(done) {
      const spy = sinon.spy();
      _ol_events_.listen(_ol_render_canvas_.labelCache, 'clear', spy);
      const interval = setInterval(function() {
        if (_ol_render_canvas_.checkedFonts_['monospace'] == retries) {
          clearInterval(interval);
          _ol_events_.unlisten(_ol_render_canvas_.labelCache, 'clear', spy);
          expect(spy.callCount).to.be(0);
          expect(_ol_render_canvas_.measureContext_).to.not.be(null);
          expect(_ol_render_canvas_.textHeights_).to.not.eql({});
          done();
        }
      }, 32);
      checkFont('12px monospace');
    });

    it('clears label cache and measurements for fonts that become available', function(done) {
      head.appendChild(font);
      _ol_events_.listen(_ol_render_canvas_.labelCache, 'clear', function() {
        expect(_ol_render_canvas_.measureContext_).to.be(null);
        expect(_ol_render_canvas_.textHeights_).to.eql({});
        done();
      });
      checkFont('12px Abel');
    });

  });


  describe('rotateAtOffset', function() {
    it('rotates a canvas at an offset point', function() {
      const context = {
        translate: sinon.spy(),
        rotate: sinon.spy()
      };
      _ol_render_canvas_.rotateAtOffset(context, Math.PI, 10, 10);
      expect(context.translate.callCount).to.be(2);
      expect(context.translate.firstCall.args).to.eql([10, 10]);
      expect(context.translate.secondCall.args).to.eql([-10, -10]);
      expect(context.rotate.callCount).to.be(1);
      expect(context.rotate.firstCall.args).to.eql([Math.PI]);
    });
  });

});
