goog.provide('ol.test.pointer.MouseSource');

describe('ol.pointer.MouseSource', function() {
  var handler;
  var target;
  var eventSpy;
  var clock;

  beforeEach(function() {
    clock = sinon.useFakeTimers();
    target = goog.dom.createElement('DIV');

    // make sure that a mouse and touch event source is used
    ol.has.POINTER = false;
    ol.has.MSPOINTER = false;
    ol.has.TOUCH = true;

    handler = new ol.pointer.PointerEventHandler(target);
    eventSpy = sinon.spy();
  });

  afterEach(function() {
    clock.restore();
    handler.dispose();
  });

  describe('simulated mouse events', function() {
    it('prevents simulated mouse events', function() {
      goog.events.listen(handler, 'pointerdown', eventSpy);

      // simulates that a mouse event is triggered from a touch
      simulateTouchEvent('touchstart', 10, 20);
      simulateEvent('mousedown', 10, 20);

      expect(eventSpy.calledOnce).to.be.ok();

    });

    it('dispatches real mouse events', function() {
      goog.events.listen(handler, 'pointerdown', eventSpy);

      // the two events are at different positions
      simulateTouchEvent('touchstart', 10, 20);
      simulateEvent('mousedown', 10, 50);

      expect(eventSpy.calledTwice).to.be.ok();
    });

    it('dispatches real mouse events after timeout', function() {
      // set the timeout to a lower value, to speed up the tests
      ol.pointer.TouchSource.DEDUP_TIMEOUT = 100;

      goog.events.listen(handler, 'pointerdown', eventSpy);

      // first simulate a touch event, then a mouse event
      // at the same position after a timeout
      simulateTouchEvent('touchstart', 10, 20);
      clock.tick(150);
      simulateEvent('mousedown', 10, 20);

      expect(eventSpy.calledTwice).to.be.ok();
    });
  });

  function simulateTouchEvent(type, x, y) {
    var touches = [
      {
        identifier: 4,
        clientX: x,
        clientY: y,
        target: target
      }
    ];

    var event = new goog.events.BrowserEvent({
      type: type,
      touches: touches,
      changedTouches: touches
    });
    goog.events.fireListeners(target, type, false, event);
  }

  function simulateEvent(type, x, y) {
    var event = new goog.events.BrowserEvent({
      type: type,
      clientX: x,
      clientY: y,
      target: target
    });
    goog.events.fireListeners(target, type, false, event);
  }
});

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.BrowserEvent');
goog.require('ol.has');
goog.require('ol.pointer.MouseSource');
goog.require('ol.pointer.PointerEvent');
goog.require('ol.pointer.PointerEventHandler');
goog.require('ol.pointer.TouchSource');
