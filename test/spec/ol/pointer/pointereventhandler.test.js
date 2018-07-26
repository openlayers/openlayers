import {listen} from '../../../../src/ol/events.js';
import EventTarget from '../../../../src/ol/events/Target.js';
import MouseSource from '../../../../src/ol/pointer/MouseSource.js';
import PointerEvent from '../../../../src/ol/pointer/PointerEvent.js';
import PointerEventHandler from '../../../../src/ol/pointer/PointerEventHandler.js';
import TouchSource from '../../../../src/ol/pointer/TouchSource.js';
import MsSource from '../../../../src/ol/pointer/MsSource.js';
import NativeSource from '../../../../src/ol/pointer/NativeSource.js';


describe('ol.pointer.PointerEventHandler', function() {
  let handler;
  let target;
  let eventSpy;

  beforeEach(function() {
    target = new EventTarget();

    // make sure that a mouse event source is used
    const POINTER = false;
    const MSPOINTER = false;
    const TOUCH = false;
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


  describe('constructor', function() {
    it('registers a least one event source', function() {
      expect(handler.eventSourceList_.length).to.be.greaterThan(0);
      expect(handler.eventSourceList_[0]).to.be.a(MouseSource);
    });
  });

  function simulateEvent(type, x, y) {
    const event = {
      type: type,
      clientX: x,
      clientY: y,
      target: target
    };
    target.dispatchEvent(event);
  }

  describe('pointer down', function() {
    it('fires pointerdown events', function() {
      listen(handler, 'pointerdown', eventSpy);
      simulateEvent('mousedown', 0, 0);
      expect(eventSpy.calledOnce).to.be.ok();

      const pointerEvent = eventSpy.firstCall.args[0];
      expect(pointerEvent).to.be.a(PointerEvent);
      expect(pointerEvent.type).to.be('pointerdown');
      expect(pointerEvent.pointerId).to.be(1);
      expect(pointerEvent.pointerType).to.be('mouse');
    });
  });

  describe('pointer up', function() {
    it('fires pointerup events', function() {
      listen(handler, 'pointerup', eventSpy);
      simulateEvent('mousedown', 0, 0);
      simulateEvent('mouseup', 0, 0);
      expect(eventSpy.calledOnce).to.be.ok();
    });
  });

  describe('pointer move', function() {
    it('fires pointermove events', function() {
      listen(handler, 'pointermove', eventSpy);
      simulateEvent('mousemove', 0, 0);
      expect(eventSpy.calledOnce).to.be.ok();
    });
  });

  describe('pointer enter and over', function() {
    it('fires pointerenter and pointerover events', function() {
      const enterEventSpy = sinon.spy();
      const overEventSpy = sinon.spy();

      listen(handler, 'pointerenter', enterEventSpy);
      listen(handler, 'pointerover', overEventSpy);

      simulateEvent('mouseover', 0, 0);

      expect(enterEventSpy.calledOnce).to.be.ok();
      expect(overEventSpy.calledOnce).to.be.ok();
    });
  });

  describe('pointer leave and out', function() {
    it('fires pointerleave and pointerout events', function() {
      const leaveEventSpy = sinon.spy();
      const outEventSpy = sinon.spy();

      listen(handler, 'pointerleave', leaveEventSpy);
      listen(handler, 'pointerout', outEventSpy);

      simulateEvent('mouseout', 0, 0);

      expect(leaveEventSpy.calledOnce).to.be.ok();
      expect(outEventSpy.calledOnce).to.be.ok();
    });
  });

  describe('#cloneEvent', function() {
    it('copies the properties of an event', function() {
      const event = {
        type: 'mousedown',
        target: target,
        clientX: 1,
        clientY: 2
      };
      const browserEvent = event;

      const eventClone = handler.cloneEvent(browserEvent, event);

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
      const event = {
        type: 'mousedown',
        target: target,
        clientX: 1,
        clientY: 2
      };
      const browserEvent = event;

      const eventClone = handler.cloneEvent(browserEvent, event);
      const pointerEvent = handler.makeEvent('pointerdown',
        eventClone, browserEvent);

      expect(pointerEvent.type).to.be('pointerdown');
      expect(pointerEvent.clientX).to.be(1);
      expect(pointerEvent.clientY).to.be(2);

      expect(pointerEvent.screenX).to.be(0);
      expect(pointerEvent.screenY).to.be(0);

      expect(pointerEvent.pointerId).to.be(0);
      expect(pointerEvent.pressure).to.be(0);

      expect(pointerEvent.preventDefault).to.be.ok();

      expect(pointerEvent).to.be.a(PointerEvent);
    });
  });

});
