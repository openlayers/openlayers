goog.require('ol.events');
goog.require('ol.obj');
goog.require('ol.render.canvas');


describe('ol.render.canvas', function() {

  var font = document.createElement('link');
  font.href = 'https://fonts.googleapis.com/css?family=Abel&text=wmytzilWMYTZIL%40%23%2F%26%3F%24%2510';
  font.rel = 'stylesheet';
  var head = document.getElementsByTagName('head')[0];

  describe('ol.render.canvas.checkFont()', function() {

    beforeEach(function() {
      ol.obj.clear(ol.render.canvas.checkedFonts_);
      ol.render.canvas.getMeasureContext();
      ol.render.canvas.measureTextHeight('12px sans-serif');
    });

    var checkFont = ol.render.canvas.checkFont;
    var retries = 60;

    it('does not clear label cache and measurements for unavailable fonts', function(done) {
      this.timeout(3000);
      var spy = sinon.spy();
      ol.events.listen(ol.render.canvas.labelCache, 'clear', spy);
      var interval = setInterval(function() {
        if (ol.render.canvas.checkedFonts_['foo'] == retries && ol.render.canvas.checkedFonts_['sans-serif'] == retries) {
          clearInterval(interval);
          ol.events.unlisten(ol.render.canvas.labelCache, 'clear', spy);
          expect(spy.callCount).to.be(0);
          expect(ol.render.canvas.measureContext_).to.not.be(null);
          expect(ol.render.canvas.textHeights_).to.not.eql({});
          done();
        }
      }, 32);
      checkFont('12px foo,sans-serif');
    });

    it('does not clear label cache and measurements for available fonts', function(done) {
      var spy = sinon.spy();
      ol.events.listen(ol.render.canvas.labelCache, 'clear', spy);
      var interval = setInterval(function() {
        if (ol.render.canvas.checkedFonts_['sans-serif'] == retries) {
          clearInterval(interval);
          ol.events.unlisten(ol.render.canvas.labelCache, 'clear', spy);
          expect(spy.callCount).to.be(0);
          expect(ol.render.canvas.measureContext_).to.not.be(null);
          expect(ol.render.canvas.textHeights_).to.not.eql({});
          done();
        }
      }, 32);
      checkFont('12px sans-serif');
    });

    it('does not clear label cache and measurements for the \'monospace\' font', function(done) {
      var spy = sinon.spy();
      ol.events.listen(ol.render.canvas.labelCache, 'clear', spy);
      var interval = setInterval(function() {
        if (ol.render.canvas.checkedFonts_['monospace'] == retries) {
          clearInterval(interval);
          ol.events.unlisten(ol.render.canvas.labelCache, 'clear', spy);
          expect(spy.callCount).to.be(0);
          expect(ol.render.canvas.measureContext_).to.not.be(null);
          expect(ol.render.canvas.textHeights_).to.not.eql({});
          done();
        }
      }, 32);
      checkFont('12px monospace');
    });

    it('clears label cache and measurements for fonts that become available', function(done) {
      head.appendChild(font);
      ol.events.listen(ol.render.canvas.labelCache, 'clear', function() {
        expect(ol.render.canvas.measureContext_).to.be(null);
        expect(ol.render.canvas.textHeights_).to.eql({});
        done();
      });
      checkFont('12px Abel');
    });

  });


  describe('rotateAtOffset', function() {
    it('rotates a canvas at an offset point', function() {
      var context = {
        translate: sinon.spy(),
        rotate: sinon.spy()
      };
      ol.render.canvas.rotateAtOffset(context, Math.PI, 10, 10);
      expect(context.translate.callCount).to.be(2);
      expect(context.translate.firstCall.args).to.eql([10, 10]);
      expect(context.translate.secondCall.args).to.eql([-10, -10]);
      expect(context.rotate.callCount).to.be(1);
      expect(context.rotate.firstCall.args).to.eql([Math.PI]);
    });
  });

});
