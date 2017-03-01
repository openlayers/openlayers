goog.provide('ol.test.pointer.TouchSource');

goog.require('ol.events');
goog.require('ol.events.Event');
goog.require('ol.events.EventTarget');
goog.require('ol.has');
goog.require('ol.obj');
goog.require('ol.pointer.PointerEventHandler');
describe('ol.pointer.TouchSource', function() {
  var handler;
  var target;
  var eventSpy;

  beforeEach(function() {
    target = new ol.events.EventTarget();

    // make sure that a mouse and touch event source is used
    ol.has.POINTER = false;
    ol.has.MSPOINTER = false;
    ol.has.TOUCH = true;

    handler = new ol.pointer.PointerEventHandler(target);
    eventSpy = sinon.spy();
  });

  afterEach(function() {
    handler.dispose();
  });

  describe('pointer event creation', function() {
    it('generates pointer events for each touch contact', function() {
      ol.events.listen(handler, 'pointerdown', eventSpy);

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
      ol.events.listen(handler, 'pointerdown', eventSpy);

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
      ol.events.listen(handler, 'pointermove', moveEventSpy);

      simulateTouchEvent('touchmove', [
        {identifier: 3, clientX: 15, clientY: 16}
      ], [{identifier: 3}, {identifier: 4}]
      );
      expect(moveEventSpy.calledOnce).to.be.ok();

      // and then both touches go up
      var upEventSpy = sinon.spy();
      ol.events.listen(handler, 'pointerup', upEventSpy);

      simulateTouchEvent('touchend', [
        {identifier: 3, clientX: 15, clientY: 16},
        {identifier: 4, clientX: 30, clientY: 45}
      ], [{identifier: 3}, {identifier: 4}]
      );
      expect(upEventSpy.calledTwice).to.be.ok();
      expect(Object.keys(handler.pointerMap).length).to.be(0);
    });

    it('handles flawed touches', function() {
      ol.events.listen(handler, 'pointerdown', eventSpy);

      // first touch
      simulateTouchEvent('touchstart', [
        {identifier: 3, clientX: 10, clientY: 11}
      ]);
      expect(eventSpy.calledOnce).to.be.ok();
      expect(Object.keys(handler.pointerMap).length).to.be(1);

      // second touch, but the first touch has disappeared
      var cancelEventSpy = sinon.spy();
      ol.events.listen(handler, 'pointercancel', cancelEventSpy);
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

    var event = new ol.events.Event(type);
    ol.obj.assign(event, {
      touches: touches,
      changedTouches: changedTouches
    });
    target.dispatchEvent(event);
  }
});
