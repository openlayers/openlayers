import Map from '../../../src/ol/Map.js';
import MapBrowserEventHandler from '../../../src/ol/MapBrowserEventHandler.js';
import {listen} from '../../../src/ol/events.js';
import {DEVICE_PIXEL_RATIO} from '../../../src/ol/has.js';
import Event from '../../../src/ol/events/Event.js';

describe('ol/MapBrowserEventHandler', function() {
  describe('#emulateClick_', function() {
    let clock;
    let handler;
    let clickSpy;
    let singleclickSpy;
    let dblclickSpy;
    let target;

    beforeEach(function() {
      clock = sinon.useFakeTimers();
      target = document.createElement('div');
      handler = new MapBrowserEventHandler(new Map({
        target: target
      }));

      clickSpy = sinon.spy();
      listen(handler, 'click', clickSpy);

      singleclickSpy = sinon.spy();
      listen(handler, 'singleclick', singleclickSpy);

      dblclickSpy = sinon.spy();
      listen(handler, 'dblclick', dblclickSpy);

    });

    afterEach(function() {
      clock.restore();
    });

    it('emulates click', function() {
      const event = new Event();
      event.type = 'pointerdown';
      event.target = target,
      event.clientX = 0;
      event.clientY = 0;
      handler.emulateClick_(event);
      expect(clickSpy.called).to.be.ok();
    });

    it('emulates singleclick', function() {
      const event = new Event();
      event.type = 'pointerdown';
      event.target = target;
      event.clientX = 0;
      event.clientY = 0;
      handler.emulateClick_(event);
      expect(singleclickSpy.called).to.not.be.ok();
      expect(dblclickSpy.called).to.not.be.ok();

      clock.tick(250);
      expect(singleclickSpy.calledOnce).to.be.ok();
      expect(dblclickSpy.called).to.not.be.ok();

      handler.emulateClick_(event);
      expect(singleclickSpy.calledOnce).to.be.ok();
      expect(dblclickSpy.called).to.not.be.ok();
    });

    it('emulates dblclick', function() {
      const event = new Event();
      event.type = 'pointerdown';
      event.target = target;
      event.clientX = 0;
      event.clientY = 0;
      handler.emulateClick_(event);
      expect(singleclickSpy.called).to.not.be.ok();
      expect(dblclickSpy.called).to.not.be.ok();

      handler.emulateClick_(event);
      expect(singleclickSpy.called).to.not.be.ok();
      expect(dblclickSpy.calledOnce).to.be.ok();

      clock.tick(250);
      expect(singleclickSpy.called).to.not.be.ok();
      expect(dblclickSpy.calledOnce).to.be.ok();
    });

  });

  describe('#down_', function() {

    let handler;
    beforeEach(function() {
      handler = new MapBrowserEventHandler(new Map({}));
    });

    it('is null if no "down" type event has been handled', function() {
      expect(handler.down_).to.be(null);
    });

    it('is an event after handlePointerDown_ has been called', function() {
      const event = new Event('pointerdown');
      handler.handlePointerDown_(event);
      expect(handler.down_).to.be(event);
    });

  });

  describe('#isMoving_', function() {
    let defaultHandler;
    let moveToleranceHandler;
    let pointerdownAt0;
    beforeEach(function() {
      defaultHandler = new MapBrowserEventHandler(new Map({}));
      moveToleranceHandler = new MapBrowserEventHandler(new Map({}), 8);
      pointerdownAt0 = new Event();
      pointerdownAt0.type = 'pointerdown';
      pointerdownAt0.clientX = 0;
      pointerdownAt0.clientY = 0;
      defaultHandler.handlePointerDown_(pointerdownAt0);
      moveToleranceHandler.handlePointerDown_(pointerdownAt0);
    });

    it('is not moving if distance is 0', function() {
      pointerdownAt0 = new Event();
      pointerdownAt0.type = 'pointerdown';
      pointerdownAt0.clientX = 0;
      pointerdownAt0.clientY = 0;
      expect(defaultHandler.isMoving_(pointerdownAt0)).to.be(false);
    });

    it('is moving if distance is 2', function() {
      const pointerdownAt2 = new Event();
      pointerdownAt2.type = 'pointerdown';
      pointerdownAt2.clientX = DEVICE_PIXEL_RATIO + 1;
      pointerdownAt2.clientY = DEVICE_PIXEL_RATIO + 1;
      expect(defaultHandler.isMoving_(pointerdownAt2)).to.be(true);
    });

    it('is moving with negative distance', function() {
      const pointerdownAt2 = new Event();
      pointerdownAt2.type = 'pointerdown';
      pointerdownAt2.clientX = -(DEVICE_PIXEL_RATIO + 1);
      pointerdownAt2.clientY = -(DEVICE_PIXEL_RATIO + 1);
      expect(defaultHandler.isMoving_(pointerdownAt2)).to.be(true);
    });

    it('is not moving if distance is less than move tolerance', function() {
      const pointerdownAt2 = new Event();
      pointerdownAt2.type = 'pointerdown';
      pointerdownAt2.clientX = DEVICE_PIXEL_RATIO + 1;
      pointerdownAt2.clientY = DEVICE_PIXEL_RATIO + 1;
      expect(moveToleranceHandler.isMoving_(pointerdownAt2)).to.be(false);
    });

    it('is moving if distance is greater than move tolerance', function() {
      const pointerdownAt9 = new Event();
      pointerdownAt9.type = 'pointerdown';
      pointerdownAt9.clientX = (DEVICE_PIXEL_RATIO * 8) + 1;
      pointerdownAt9.clientY = (DEVICE_PIXEL_RATIO * 8) + 1;
      expect(moveToleranceHandler.isMoving_(pointerdownAt9)).to.be(true);
    });

    it('is moving when moving back close to the down pixel', function() {
      const pointermoveAt9 = new Event();
      pointermoveAt9.type = 'pointermove';
      pointermoveAt9.clientX = (DEVICE_PIXEL_RATIO * 8) + 1;
      pointermoveAt9.clientY = (DEVICE_PIXEL_RATIO * 8) + 1;
      moveToleranceHandler.handlePointerMove_(pointermoveAt9);
      expect(moveToleranceHandler.isMoving_(pointermoveAt9)).to.be(true);
      const pointermoveAt2 = new Event();
      pointermoveAt2.type = 'pointermove';
      pointermoveAt2.clientX = DEVICE_PIXEL_RATIO + 1;
      pointermoveAt2.clientY = DEVICE_PIXEL_RATIO + 1;
      moveToleranceHandler.handlePointerMove_(pointermoveAt2);
      expect(moveToleranceHandler.isMoving_(pointermoveAt2)).to.be(true);
    });
  });

  describe('handleTouchMove_', function() {
    let handler;
    beforeEach(function() {
      handler = new MapBrowserEventHandler(new Map({}));
    });
    it('prevents default on touchmove event', function() {
      handler.originalPointerMoveEvent_ = {
        defaultPrevented: true
      };
      const event = {
        preventDefault: sinon.spy()
      };
      handler.handleTouchMove_(event);
      expect(event.preventDefault.callCount).to.be(1);
    });
  });
});
