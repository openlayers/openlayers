goog.provide('ol.test.MapBrowserEventHandler');

describe('ol.MapBrowserEventHandler', function() {
  describe('#emulateClick_', function() {
    var clock;
    var handler;
    var clickSpy;
    var singleclickSpy;
    var dblclickSpy;
    var target;

    beforeEach(function() {
      clock = sinon.useFakeTimers();
      target = goog.dom.createElement(goog.dom.TagName.DIV);
      handler = new ol.MapBrowserEventHandler(new ol.Map({
        target: target
      }));

      clickSpy = sinon.spy();
      goog.events.listen(handler, 'click', clickSpy);

      singleclickSpy = sinon.spy();
      goog.events.listen(handler, 'singleclick', singleclickSpy);

      dblclickSpy = sinon.spy();
      goog.events.listen(handler, 'dblclick', dblclickSpy);

    });

    afterEach(function() {
      clock.restore();
    });

    it('emulates click', function() {
      handler.emulateClick_(new ol.pointer.PointerEvent('pointerdown',
          new goog.events.BrowserEvent({
            type: 'mousedown',
            target: target,
            clientX: 0,
            clientY: 0
          })));
      expect(clickSpy.called).to.be.ok();
    });

    it('emulates singleclick', function() {
      handler.emulateClick_(new ol.pointer.PointerEvent('pointerdown',
          new goog.events.BrowserEvent({
            type: 'mousedown',
            target: target,
            clientX: 0,
            clientY: 0
          })));
      expect(singleclickSpy.called).to.not.be.ok();
      expect(dblclickSpy.called).to.not.be.ok();

      clock.tick(250);
      expect(singleclickSpy.calledOnce).to.be.ok();
      expect(dblclickSpy.called).to.not.be.ok();

      handler.emulateClick_(new ol.pointer.PointerEvent('pointerdown',
          new goog.events.BrowserEvent({
            type: 'mousedown',
            target: target,
            clientX: 0,
            clientY: 0
          })));
      expect(singleclickSpy.calledOnce).to.be.ok();
      expect(dblclickSpy.called).to.not.be.ok();
    });

    it('emulates dblclick', function() {
      handler.emulateClick_(new ol.pointer.PointerEvent('pointerdown',
          new goog.events.BrowserEvent({
            type: 'mousedown',
            target: target,
            clientX: 0,
            clientY: 0
          })));
      expect(singleclickSpy.called).to.not.be.ok();
      expect(dblclickSpy.called).to.not.be.ok();

      handler.emulateClick_(new ol.pointer.PointerEvent('pointerdown',
          new goog.events.BrowserEvent({
            type: 'mousedown',
            target: target,
            clientX: 0,
            clientY: 0
          })));
      expect(singleclickSpy.called).to.not.be.ok();
      expect(dblclickSpy.calledOnce).to.be.ok();

      clock.tick(250);
      expect(singleclickSpy.called).to.not.be.ok();
      expect(dblclickSpy.calledOnce).to.be.ok();
    });

  });

  describe('#getDown()', function() {

    var handler;
    beforeEach(function() {
      handler = new ol.MapBrowserEventHandler(new ol.Map({}));
    });

    it('returns null if no "down" type event has been handled', function() {
      expect(handler.getDown()).to.be(null);
    });

    it('returns an event after handlePointerDown_ has been called', function() {
      var event = new ol.pointer.PointerEvent('pointerdown',
          new goog.events.BrowserEvent({}));
      handler.handlePointerDown_(event);
      expect(handler.getDown()).to.be(event);
    });

  });
});

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.BrowserEvent');
goog.require('ol.Map');
goog.require('ol.MapBrowserEventHandler');
goog.require('ol.pointer.PointerEvent');
