import {listen} from '../../../../src/ol/events.js';
import EventTarget from '../../../../src/ol/events/Target.js';
import PointerEventHandler from '../../../../src/ol/pointer/PointerEventHandler.js';
import TouchSource from '../../../../src/ol/pointer/TouchSource.js';
import MouseSource from '../../../../src/ol/pointer/MouseSource.js';
import MsSource from '../../../../src/ol/pointer/MsSource.js';
import NativeSource from '../../../../src/ol/pointer/NativeSource.js';


describe('ol.pointer.MouseSource', function() {
  let handler;
  let target;
  let eventSpy;
  let clock;

  beforeEach(function() {
    clock = sinon.useFakeTimers();
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
          const touchSource = new TouchSource(this, mouseSource);
          // set the timeout to a lower value, to speed up the tests
          touchSource.dedupTimeout_ = 100;

          this.registerSource('touch', touchSource);
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
    clock.restore();
    handler.dispose();
  });

  describe('simulated mouse events', function() {
    it('prevents simulated mouse events', function() {
      listen(handler, 'pointerdown', eventSpy);

      // simulates that a mouse event is triggered from a touch
      simulateTouchEvent('touchstart', 10, 20);
      simulateEvent('mousedown', 10, 20);

      expect(eventSpy.calledOnce).to.be.ok();

    });

    it('dispatches real mouse events', function() {
      listen(handler, 'pointerdown', eventSpy);

      // the two events are at different positions
      simulateTouchEvent('touchstart', 10, 20);
      simulateEvent('mousedown', 10, 50);

      expect(eventSpy.calledTwice).to.be.ok();
    });

    it('dispatches real mouse events after timeout', function() {
      listen(handler, 'pointerdown', eventSpy);

      // first simulate a touch event, then a mouse event
      // at the same position after a timeout
      simulateTouchEvent('touchstart', 10, 20);
      clock.tick(150);
      simulateEvent('mousedown', 10, 20);

      expect(eventSpy.calledTwice).to.be.ok();
    });
  });

  function simulateTouchEvent(type, x, y) {
    const touches = [{
      identifier: 4,
      clientX: x,
      clientY: y,
      target: target
    }];

    const event = {
      type: type,
      touches: touches,
      changedTouches: touches
    };
    target.dispatchEvent(event);
  }

  function simulateEvent(type, x, y) {
    const event = {
      type: type,
      clientX: x,
      clientY: y,
      target: target
    };
    target.dispatchEvent(event);
  }
});
