import {listen} from '../../../../src/ol/events.js';
import Event from '../../../../src/ol/events/Event.js';
import EventTarget from '../../../../src/ol/events/Target.js';
import {assign} from '../../../../src/ol/obj.js';
import PointerEventHandler from '../../../../src/ol/pointer/PointerEventHandler.js';
import TouchSource from '../../../../src/ol/pointer/TouchSource.js';
import MouseSource from '../../../../src/ol/pointer/MouseSource.js';
import MsSource from '../../../../src/ol/pointer/MsSource.js';
import NativeSource from '../../../../src/ol/pointer/NativeSource.js';

describe('ol.pointer.TouchSource', function() {
  let handler;
  let target;
  let eventSpy;

  beforeEach(function() {
    target = new EventTarget();

    // make sure that a mouse and touch event source is used
    const POINTER = false;
    const MSPOINTER = false;
    const TOUCH = true;
    const originalRegisterSources = PointerEventHandler.prototype.registerSources;
    PointerEventHandler.prototype.registerSources = function() {
      if (POINTER) {
        this.registerSource('native', new NativeSource(this));
      } else if (MSPOINTER) {
        this.registerSource('ms', new MsSource(this));
      } else {
        const mouseSource = new MouseSource(this);
        this.registerSource('mouse', mouseSource);

        if (TOUCH) {
          this.registerSource('touch', new TouchSource(this, mouseSource));
        }
      }

      // register events on the viewport element
      this.register_();
    };

    handler = new PointerEventHandler(target);
    PointerEventHandler.prototype.registerSources = originalRegisterSources;

    eventSpy = sinon.spy();
  });

  afterEach(function() {
    handler.dispose();
  });

  describe('pointer event creation', function() {
    it('generates pointer events for each touch contact', function() {
      listen(handler, 'pointerdown', eventSpy);

      simulateTouchEvent('touchstart', [
        {identifier: 3, clientX: 10, clientY: 11},
        {identifier: 4, clientX: 30, clientY: 45}
      ]);

      expect(eventSpy.calledTwice).to.be.ok();

      // pointer event for the first touch contact
      const pointerEvent1 = eventSpy.firstCall.args[0];
      expect(pointerEvent1.pointerId).to.be(5);
      expect(pointerEvent1.pointerType).to.be('touch');
      expect(pointerEvent1.clientX).to.be(10);
      expect(pointerEvent1.clientY).to.be(11);

      // pointer event for the second touch contact
      const pointerEvent2 = eventSpy.secondCall.args[0];
      expect(pointerEvent2.pointerId).to.be(6);
      expect(pointerEvent2.pointerType).to.be('touch');
      expect(pointerEvent2.clientX).to.be(30);
      expect(pointerEvent2.clientY).to.be(45);

      expect(Object.keys(handler.pointerMap).length).to.be(2);
    });

    it('creates the right pointer events', function() {
      listen(handler, 'pointerdown', eventSpy);

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
      const moveEventSpy = sinon.spy();
      listen(handler, 'pointermove', moveEventSpy);

      simulateTouchEvent('touchmove', [
        {identifier: 3, clientX: 15, clientY: 16}
      ], [{identifier: 3}, {identifier: 4}]
      );
      expect(moveEventSpy.calledOnce).to.be.ok();

      // and then both touches go up
      const upEventSpy = sinon.spy();
      listen(handler, 'pointerup', upEventSpy);

      simulateTouchEvent('touchend', [
        {identifier: 3, clientX: 15, clientY: 16},
        {identifier: 4, clientX: 30, clientY: 45}
      ], [{identifier: 3}, {identifier: 4}]
      );
      expect(upEventSpy.calledTwice).to.be.ok();
      expect(Object.keys(handler.pointerMap).length).to.be(0);
    });

    it('handles flawed touches', function() {
      listen(handler, 'pointerdown', eventSpy);

      // first touch
      simulateTouchEvent('touchstart', [
        {identifier: 3, clientX: 10, clientY: 11}
      ]);
      expect(eventSpy.calledOnce).to.be.ok();
      expect(Object.keys(handler.pointerMap).length).to.be(1);

      // second touch, but the first touch has disappeared
      const cancelEventSpy = sinon.spy();
      listen(handler, 'pointercancel', cancelEventSpy);
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

    const event = new Event(type);
    assign(event, {
      touches: touches,
      changedTouches: changedTouches
    });
    target.dispatchEvent(event);
  }
});
