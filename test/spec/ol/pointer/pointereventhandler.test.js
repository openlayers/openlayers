goog.provide('ol.test.pointer.PointerEventHandler');

describe('ol.pointer.PointerEventHandler', function() {
  var handler;
  var target;
  var eventSpy;

  beforeEach(function() {
    target = goog.dom.createElement(goog.dom.TagName.DIV);

    // make sure that a mouse event source is used
    ol.has.POINTER = false;
    ol.has.MSPOINTER = false;

    handler = new ol.pointer.PointerEventHandler(target);
    eventSpy = sinon.spy();
  });

  afterEach(function() {
    handler.dispose();
  });


  describe('constructor', function() {
    it('registers a least one event source', function() {
      expect(handler.eventSourceList_.length).to.be.greaterThan(0);
      expect(handler.eventSourceList_[0]).to.be.a(ol.pointer.MouseSource);
    });
  });

  function simulateEvent(type, x, y) {
    var event = new goog.events.BrowserEvent({
      type: type,
      clientX: x,
      clientY: y,
      target: target
    });
    goog.events.fireListeners(target, type, false, event);
  }

  describe('pointer down', function() {
    it('fires pointerdown events', function() {
      goog.events.listen(handler, 'pointerdown', eventSpy);
      simulateEvent('mousedown', 0, 0);
      expect(eventSpy.calledOnce).to.be.ok();

      var pointerEvent = eventSpy.firstCall.args[0];
      expect(pointerEvent).to.be.a(ol.pointer.PointerEvent);
      expect(pointerEvent.type).to.be('pointerdown');
      expect(pointerEvent.pointerId).to.be(1);
      expect(pointerEvent.pointerType).to.be('mouse');
    });
  });

  describe('pointer up', function() {
    it('fires pointerup events', function() {
      goog.events.listen(handler, 'pointerup', eventSpy);
      simulateEvent('mousedown', 0, 0);
      simulateEvent('mouseup', 0, 0);
      expect(eventSpy.calledOnce).to.be.ok();
    });
  });

  describe('pointer move', function() {
    it('fires pointermove events', function() {
      goog.events.listen(handler, 'pointermove', eventSpy);
      simulateEvent('mousemove', 0, 0);
      expect(eventSpy.calledOnce).to.be.ok();
    });
  });

  describe('pointer enter and over', function() {
    it('fires pointerenter and pointerover events', function() {
      var enterEventSpy = sinon.spy();
      var overEventSpy = sinon.spy();

      goog.events.listen(handler, 'pointerenter', enterEventSpy);
      goog.events.listen(handler, 'pointerover', overEventSpy);

      simulateEvent('mouseover', 0, 0);

      expect(enterEventSpy.calledOnce).to.be.ok();
      expect(overEventSpy.calledOnce).to.be.ok();
    });
  });

  describe('pointer leave and out', function() {
    it('fires pointerleave and pointerout events', function() {
      var leaveEventSpy = sinon.spy();
      var outEventSpy = sinon.spy();

      goog.events.listen(handler, 'pointerleave', leaveEventSpy);
      goog.events.listen(handler, 'pointerout', outEventSpy);

      simulateEvent('mouseout', 0, 0);

      expect(leaveEventSpy.calledOnce).to.be.ok();
      expect(outEventSpy.calledOnce).to.be.ok();
    });
  });

  describe('#cloneEvent', function() {
    it('copies the properties of an event', function() {
      var event = {
        type: 'mousedown',
        target: target,
        clientX: 1,
        clientY: 2
      };
      var browserEvent = new goog.events.BrowserEvent(event);

      var eventClone = handler.cloneEvent(browserEvent, event);

      // properties are copied from `event`
      expect(eventClone.type).to.be('mousedown');
      expect(eventClone.target).to.be(target);
      expect(eventClone.clientX).to.be(1);
      expect(eventClone.clientY).to.be(2);

      // properties are copied from `browserEvent`
      expect(eventClone.screenX).to.be(0);
      expect(eventClone.screenY).to.be(0);

      // properties are copied from the defaults
      expect(eventClone.pointerId).to.be(0);
      expect(eventClone.pressure).to.be(0);

    });
  });

  describe('#makeEvent', function() {
    it('makes a new pointer event', function() {
      var event = {
        type: 'mousedown',
        target: target,
        clientX: 1,
        clientY: 2
      };
      var browserEvent = new goog.events.BrowserEvent(event);

      var eventClone = handler.cloneEvent(browserEvent, event);
      var pointerEvent = handler.makeEvent('pointerdown',
          eventClone, browserEvent);

      expect(pointerEvent.type).to.be('pointerdown');
      expect(pointerEvent.clientX).to.be(1);
      expect(pointerEvent.clientY).to.be(2);

      expect(pointerEvent.screenX).to.be(0);
      expect(pointerEvent.screenY).to.be(0);

      expect(pointerEvent.pointerId).to.be(0);
      expect(pointerEvent.pressure).to.be(0);

      expect(pointerEvent.preventDefault).to.be.ok();

      expect(pointerEvent).to.be.a(ol.pointer.PointerEvent);
    });
  });

});

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.BrowserEvent');
goog.require('ol.has');
goog.require('ol.pointer.MouseSource');
goog.require('ol.pointer.PointerEvent');
goog.require('ol.pointer.PointerEventHandler');
