goog.provide('ol.test.render.canvas');

goog.require('ol.render.canvas');


describe('ol.render.canvas', function() {

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
