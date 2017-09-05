

import _ol_events_ from '../../../../src/ol/events';
import _ol_events_EventTarget_ from '../../../../src/ol/events/eventtarget';
import _ol_has_ from '../../../../src/ol/has';
import _ol_pointer_PointerEventHandler_ from '../../../../src/ol/pointer/pointereventhandler';
import _ol_pointer_TouchSource_ from '../../../../src/ol/pointer/touchsource';


describe('ol.pointer.MouseSource', function() {
  var handler;
  var target;
  var eventSpy;
  var clock;

  beforeEach(function() {
    clock = sinon.useFakeTimers();
    target = new _ol_events_EventTarget_();

    // make sure that a mouse and touch event source is used
    _ol_has_.POINTER = false;
    _ol_has_.MSPOINTER = false;
    _ol_has_.TOUCH = true;

    handler = new _ol_pointer_PointerEventHandler_(target);
    eventSpy = sinon.spy();
  });

  afterEach(function() {
    clock.restore();
    handler.dispose();
  });

  describe('simulated mouse events', function() {
    it('prevents simulated mouse events', function() {
      _ol_events_.listen(handler, 'pointerdown', eventSpy);

      // simulates that a mouse event is triggered from a touch
      simulateTouchEvent('touchstart', 10, 20);
      simulateEvent('mousedown', 10, 20);

      expect(eventSpy.calledOnce).to.be.ok();

    });

    it('dispatches real mouse events', function() {
      _ol_events_.listen(handler, 'pointerdown', eventSpy);

      // the two events are at different positions
      simulateTouchEvent('touchstart', 10, 20);
      simulateEvent('mousedown', 10, 50);

      expect(eventSpy.calledTwice).to.be.ok();
    });

    it('dispatches real mouse events after timeout', function() {
      // set the timeout to a lower value, to speed up the tests
      _ol_pointer_TouchSource_.DEDUP_TIMEOUT = 100;

      _ol_events_.listen(handler, 'pointerdown', eventSpy);

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
