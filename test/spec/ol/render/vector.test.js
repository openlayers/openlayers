goog.provide('ol.test.renderer.vector');

describe('ol.renderer.vector', function() {
  describe('#renderFeature', function() {
    var replayGroup;

    beforeEach(function() {
      replayGroup = new ol.render.canvas.ReplayGroup(1);
    });

    describe('call multiple times', function() {

      it('does not set multiple listeners', function() {
        var iconStyle = new ol.style.Icon({
          src: 'http://example.com/icon.png'
        });

        var iconImage = iconStyle.iconImage_;

        var iconStyleLoadSpy = sinon.stub(iconStyle, 'load', function() {
          iconImage.imageState_ = ol.style.ImageState.LOADING;
        });

        var style = new ol.style.Style({
          image: iconStyle
        });

        var feature = new ol.Feature();

        var listener = function() {};
        var listenerThis = {};
        var listeners;

        // call #1
        ol.renderer.vector.renderFeature(replayGroup, feature,
            style, 1, feature, listener, listenerThis);

        expect(iconStyleLoadSpy.calledOnce).to.be.ok();
        listeners = goog.events.getListeners(
            iconStyle.iconImage_, goog.events.EventType.CHANGE, false);
        expect(listeners.length).to.eql(1);

        // call #2
        ol.renderer.vector.renderFeature(replayGroup, feature,
            style, 1, feature, listener, listenerThis);

        expect(iconStyleLoadSpy.calledOnce).to.be.ok();
        listeners = goog.events.getListeners(
            iconStyle.iconImage_, goog.events.EventType.CHANGE, false);
        expect(listeners.length).to.eql(1);
      });

    });

  });
});

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.render.canvas.ReplayGroup');
goog.require('ol.renderer.vector');
goog.require('ol.style.Icon');
goog.require('ol.style.ImageState');
goog.require('ol.style.Style');
goog.require('ol.Feature');
