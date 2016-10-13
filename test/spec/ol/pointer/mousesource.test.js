goog.provide('ol.test.pointer.MouseSource');

goog.require('ol.events');
goog.require('ol.events.EventTarget');
goog.require('ol.has');
goog.require('ol.pointer.PointerEventHandler');
goog.require('ol.pointer.TouchSource');


describe('ol.pointer.MouseSource', function() {
  var handler;
  var target;
  var eventSpy;
  var clock;

  beforeEach(function() {
    clock = sinon.useFakeTimers();
    target = new ol.events.EventTarget();

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
      ol.events.listen(handler, 'pointerdown', eventSpy);

      // simulates that a mouse event is triggered from a touch
      simulateTouchEvent('touchstart', 10, 20);
      simulateEvent('mousedown', 10, 20);

      expect(eventSpy.calledOnce).to.be.ok();

    });

    it('dispatches real mouse events', function() {
      ol.events.listen(handler, 'pointerdown', eventSpy);

      // the two events are at different positions
      simulateTouchEvent('touchstart', 10, 20);
      simulateEvent('mousedown', 10, 50);

      expect(eventSpy.calledTwice).to.be.ok();
    });

    it('dispatches real mouse events after timeout', function() {
      // set the timeout to a lower value, to speed up the tests
      ol.pointer.TouchSource.DEDUP_TIMEOUT = 100;

      ol.events.listen(handler, 'pointerdown', eventSpy);

      // first simulate a touch event, then a mouse event
      // at the same position after a timeout
      simulateTouchEvent('touchstart', 10, 20);
      clock.tick(150);
      simulateEvent('mousedown', 10, 20);

      expect(eventSpy.calledTwice).to.be.ok();
    });
  });

  function simulateTouchEvent(type, x, y) {
    var touches = [{
      identifier: 4,
      clientX: x,
      clientY: y,
      target: target
    }];

    var event = {
      type: type,
      touches: touches,
      changedTouches: touches
    };
    target.dispatchEvent(event);
  }

  function simulateEvent(type, x, y) {
    var event = {
      type: type,
      clientX: x,
      clientY: y,
      target: target
    };
    target.dispatchEvent(event);
  }
});
