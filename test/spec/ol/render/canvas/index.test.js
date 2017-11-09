goog.require('ol.events');
goog.require('ol.obj');
goog.require('ol.render.canvas');


describe('ol.render.canvas', function() {

  var font = document.createElement('link');
  font.href = 'https://fonts.googleapis.com/css?family=Abel&text=wmytzilWMYTZIL%40%23%2F%26%3F%24%2510';
  font.rel = 'stylesheet';
  var head = document.getElementsByTagName('head')[0];

  describe('ol.render.canvas.checkFont()', function() {

    var checkFont = ol.render.canvas.checkFont;

    it('does not clear the label cache for unavailable fonts', function(done) {
      ol.obj.clear(ol.render.canvas.checkedFonts_);
      var spy = sinon.spy();
      ol.events.listen(ol.render.canvas.labelCache, 'clear', spy);
      checkFont('12px foo,sans-serif');
      setTimeout(function() {
        ol.events.unlisten(ol.render.canvas.labelCache, 'clear', spy);
        expect(spy.callCount).to.be(0);
        done();
      }, 1600);
    });

    it('does not clear the label cache for available fonts', function(done) {
      ol.obj.clear(ol.render.canvas.checkedFonts_);
      var spy = sinon.spy();
      ol.events.listen(ol.render.canvas.labelCache, 'clear', spy);
      checkFont('12px sans-serif');
      setTimeout(function() {
        ol.events.unlisten(ol.render.canvas.labelCache, 'clear', spy);
        expect(spy.callCount).to.be(0);
        done();
      }, 800);
    });

    it('does not clear the label cache for the \'monospace\' font', function(done) {
      ol.obj.clear(ol.render.canvas.checkedFonts_);
      var spy = sinon.spy();
      ol.events.listen(ol.render.canvas.labelCache, 'clear', spy);
      checkFont('12px monospace');
      setTimeout(function() {
        ol.events.unlisten(ol.render.canvas.labelCache, 'clear', spy);
        expect(spy.callCount).to.be(0);
        done();
      }, 800);
    });

    it('clears the label cache for fonts that become available', function(done) {
      ol.obj.clear(ol.render.canvas.checkedFonts_);
      head.appendChild(font);
      var spy = sinon.spy();
      ol.events.listen(ol.render.canvas.labelCache, 'clear', spy);
      checkFont('12px Abel');
      setTimeout(function() {
        ol.events.unlisten(ol.render.canvas.labelCache, 'clear', spy);
        head.removeChild(font);
        expect(spy.callCount).to.be(1);
        done();
      }, 1600);
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
