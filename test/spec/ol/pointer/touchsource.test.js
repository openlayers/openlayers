

import _ol_events_ from '../../../../src/ol/events';
import _ol_events_Event_ from '../../../../src/ol/events/event';
import _ol_events_EventTarget_ from '../../../../src/ol/events/eventtarget';
import _ol_has_ from '../../../../src/ol/has';
import _ol_obj_ from '../../../../src/ol/obj';
import _ol_pointer_PointerEventHandler_ from '../../../../src/ol/pointer/pointereventhandler';
describe('ol.pointer.TouchSource', function() {
  var handler;
  var target;
  var eventSpy;

  beforeEach(function() {
    target = new _ol_events_EventTarget_();

    // make sure that a mouse and touch event source is used
    _ol_has_.POINTER = false;
    _ol_has_.MSPOINTER = false;
    _ol_has_.TOUCH = true;

    handler = new _ol_pointer_PointerEventHandler_(target);
    eventSpy = sinon.spy();
  });

  afterEach(function() {
    handler.dispose();
  });

  describe('pointer event creation', function() {
    it('generates pointer events for each touch contact', function() {
      _ol_events_.listen(handler, 'pointerdown', eventSpy);

      simulateTouchEvent('touchstart', [
        {identifier: 3, clientX: 10, clientY: 11},
        {identifier: 4, clientX: 30, clientY: 45}
      ]);

      expect(eventSpy.calledTwice).to.be.ok();

      // pointer event for the first touch contact
      var pointerEvent1 = eventSpy.firstCall.args[0];
      expect(pointerEvent1.pointerId).to.be(5);
      expect(pointerEvent1.pointerType).to.be('touch');
      expect(pointerEvent1.clientX).to.be(10);
      expect(pointerEvent1.clientY).to.be(11);

      // pointer event for the second touch contact
      var pointerEvent2 = eventSpy.secondCall.args[0];
      expect(pointerEvent2.pointerId).to.be(6);
      expect(pointerEvent2.pointerType).to.be('touch');
      expect(pointerEvent2.clientX).to.be(30);
      expect(pointerEvent2.clientY).to.be(45);

      expect(Object.keys(handler.pointerMap).length).to.be(2);
    });

    it('creates the right pointer events', function() {
      _ol_events_.listen(handler, 'pointerdown', eventSpy);

      // first touch
      simulateTouchEvent('touchstart', [
        {identifier: 3, clientX: 10, clientY: 11}
      ]);
      expect(eventSpy.calledOnce).to.be.ok();
      expect(Object.keys(handler.pointerMap).length).to.be(1);

      // second touch (first touch still down)
      simulateTouchEvent('touchstart', [
        {identifier: 4, clientX: 30, clientY: 45}
      ], [{identifier: 3}, {identifier: 4}]
      );
      expect(eventSpy.calledTwice).to.be.ok();
      expect(Object.keys(handler.pointerMap).length).to.be(2);

      // first touch moves
      var moveEventSpy = sinon.spy();
      _ol_events_.listen(handler, 'pointermove', moveEventSpy);

      simulateTouchEvent('touchmove', [
        {identifier: 3, clientX: 15, clientY: 16}
      ], [{identifier: 3}, {identifier: 4}]
      );
      expect(moveEventSpy.calledOnce).to.be.ok();

      // and then both touches go up
      var upEventSpy = sinon.spy();
      _ol_events_.listen(handler, 'pointerup', upEventSpy);

      simulateTouchEvent('touchend', [
        {identifier: 3, clientX: 15, clientY: 16},
        {identifier: 4, clientX: 30, clientY: 45}
      ], [{identifier: 3}, {identifier: 4}]
      );
      expect(upEventSpy.calledTwice).to.be.ok();
      expect(Object.keys(handler.pointerMap).length).to.be(0);
    });

    it('handles flawed touches', function() {
      _ol_events_.listen(handler, 'pointerdown', eventSpy);

      // first touch
      simulateTouchEvent('touchstart', [
        {identifier: 3, clientX: 10, clientY: 11}
      ]);
      expect(eventSpy.calledOnce).to.be.ok();
      expect(Object.keys(handler.pointerMap).length).to.be(1);

      // second touch, but the first touch has disappeared
      var cancelEventSpy = sinon.spy();
      _ol_events_.listen(handler, 'pointercancel', cancelEventSpy);
      simulateTouchEvent('touchstart', [
        {identifier: 4, clientX: 30, clientY: 45}
      ], [{identifier: 4}]
      );
      expect(eventSpy.calledTwice).to.be.ok();

      // the first (broken) touch is canceled
      expect(cancelEventSpy.calledOnce).to.be.ok();
      expect(Object.keys(handler.pointerMap).length).to.be(1);
    });
  });

  function simulateTouchEvent(type, changedTouches, touches) {
    touches = touches !== undefined ? touches : changedTouches;

    var event = new _ol_events_Event_(type);
    _ol_obj_.assign(event, {
      touches: touches,
      changedTouches: changedTouches
    });
    target.dispatchEvent(event);
  }
});
