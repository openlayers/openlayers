

import _ol_events_ from '../../../../src/ol/events';
import _ol_events_EventTarget_ from '../../../../src/ol/events/eventtarget';
import _ol_has_ from '../../../../src/ol/has';
import _ol_pointer_MouseSource_ from '../../../../src/ol/pointer/mousesource';
import _ol_pointer_PointerEvent_ from '../../../../src/ol/pointer/pointerevent';
import _ol_pointer_PointerEventHandler_ from '../../../../src/ol/pointer/pointereventhandler';


describe('ol.pointer.PointerEventHandler', function() {
  var handler;
  var target;
  var eventSpy;

  beforeEach(function() {
    target = new _ol_events_EventTarget_();

    // make sure that a mouse event source is used
    _ol_has_.POINTER = false;
    _ol_has_.MSPOINTER = false;

    handler = new _ol_pointer_PointerEventHandler_(target);
    eventSpy = sinon.spy();
  });

  afterEach(function() {
    handler.dispose();
  });


  describe('constructor', function() {
    it('registers a least one event source', function() {
      expect(handler.eventSourceList_.length).to.be.greaterThan(0);
      expect(handler.eventSourceList_[0]).to.be.a(_ol_pointer_MouseSource_);
    });
  });

  function simulateEvent(type, x, y) {
    var event = {
      type: type,
      clientX: x,
      clientY: y,
      target: target
    };
    target.dispatchEvent(event);
  }

  describe('pointer down', function() {
    it('fires pointerdown events', function() {
      _ol_events_.listen(handler, 'pointerdown', eventSpy);
      simulateEvent('mousedown', 0, 0);
      expect(eventSpy.calledOnce).to.be.ok();

      var pointerEvent = eventSpy.firstCall.args[0];
      expect(pointerEvent).to.be.a(_ol_pointer_PointerEvent_);
      expect(pointerEvent.type).to.be('pointerdown');
      expect(pointerEvent.pointerId).to.be(1);
      expect(pointerEvent.pointerType).to.be('mouse');
    });
  });

  describe('pointer up', function() {
    it('fires pointerup events', function() {
      _ol_events_.listen(handler, 'pointerup', eventSpy);
      simulateEvent('mousedown', 0, 0);
      simulateEvent('mouseup', 0, 0);
      expect(eventSpy.calledOnce).to.be.ok();
    });
  });

  describe('pointer move', function() {
    it('fires pointermove events', function() {
      _ol_events_.listen(handler, 'pointermove', eventSpy);
      simulateEvent('mousemove', 0, 0);
      expect(eventSpy.calledOnce).to.be.ok();
    });
  });

  describe('pointer enter and over', function() {
    it('fires pointerenter and pointerover events', function() {
      var enterEventSpy = sinon.spy();
      var overEventSpy = sinon.spy();

      _ol_events_.listen(handler, 'pointerenter', enterEventSpy);
      _ol_events_.listen(handler, 'pointerover', overEventSpy);

      simulateEvent('mouseover', 0, 0);

      expect(enterEventSpy.calledOnce).to.be.ok();
      expect(overEventSpy.calledOnce).to.be.ok();
    });
  });

  describe('pointer leave and out', function() {
    it('fires pointerleave and pointerout events', function() {
      var leaveEventSpy = sinon.spy();
      var outEventSpy = sinon.spy();

      _ol_events_.listen(handler, 'pointerleave', leaveEventSpy);
      _ol_events_.listen(handler, 'pointerout', outEventSpy);

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
      var browserEvent = event;

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
      var browserEvent = event;

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

      expect(pointerEvent).to.be.a(_ol_pointer_PointerEvent_);
    });
  });

});
