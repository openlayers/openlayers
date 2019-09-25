import Map from '../../../src/ol/Map.js';
import MapBrowserEventHandler from '../../../src/ol/MapBrowserEventHandler.js';
import {listen} from '../../../src/ol/events.js';
import {DEVICE_PIXEL_RATIO} from '../../../src/ol/has.js';
import Event from '../../../src/ol/events/Event.js';

describe('ol.MapBrowserEventHandler', () => {
  describe('#emulateClick_', () => {
    let clock;
    let handler;
    let clickSpy;
    let singleclickSpy;
    let dblclickSpy;
    let target;

    beforeEach(() => {
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

    afterEach(() => {
      clock.restore();
    });

    test('emulates click', () => {
      const event = new Event();
      event.type = 'pointerdown';
      event.target = target,
      event.clientX = 0;
      event.clientY = 0;
      handler.emulateClick_(event);
      expect(clickSpy.called).toBeTruthy();
    });

    test('emulates singleclick', () => {
      const event = new Event();
      event.type = 'pointerdown';
      event.target = target;
      event.clientX = 0;
      event.clientY = 0;
      handler.emulateClick_(event);
      expect(singleclickSpy.called).toBeFalsy();
      expect(dblclickSpy.called).toBeFalsy();

      clock.tick(250);
      expect(singleclickSpy.calledOnce).toBeTruthy();
      expect(dblclickSpy.called).toBeFalsy();

      handler.emulateClick_(event);
      expect(singleclickSpy.calledOnce).toBeTruthy();
      expect(dblclickSpy.called).toBeFalsy();
    });

    test('emulates dblclick', () => {
      const event = new Event();
      event.type = 'pointerdown';
      event.target = target;
      event.clientX = 0;
      event.clientY = 0;
      handler.emulateClick_(event);
      expect(singleclickSpy.called).toBeFalsy();
      expect(dblclickSpy.called).toBeFalsy();

      handler.emulateClick_(event);
      expect(singleclickSpy.called).toBeFalsy();
      expect(dblclickSpy.calledOnce).toBeTruthy();

      clock.tick(250);
      expect(singleclickSpy.called).toBeFalsy();
      expect(dblclickSpy.calledOnce).toBeTruthy();
    });

  });

  describe('#down_', () => {

    let handler;
    beforeEach(() => {
      handler = new MapBrowserEventHandler(new Map({}));
    });

    test('is null if no "down" type event has been handled', () => {
      expect(handler.down_).toBe(null);
    });

    test('is an event after handlePointerDown_ has been called', () => {
      const event = new Event('pointerdown');
      handler.handlePointerDown_(event);
      expect(handler.down_).toBe(event);
    });

  });

  describe('#isMoving_', () => {
    let defaultHandler;
    let moveToleranceHandler;
    let pointerdownAt0;
    beforeEach(() => {
      defaultHandler = new MapBrowserEventHandler(new Map({}));
      moveToleranceHandler = new MapBrowserEventHandler(new Map({}), 8);
      pointerdownAt0 = new Event();
      pointerdownAt0.type = 'pointerdown';
      pointerdownAt0.clientX = 0;
      pointerdownAt0.clientY = 0;
      defaultHandler.handlePointerDown_(pointerdownAt0);
      moveToleranceHandler.handlePointerDown_(pointerdownAt0);
    });

    test('is not moving if distance is 0', () => {
      pointerdownAt0 = new Event();
      pointerdownAt0.type = 'pointerdown';
      pointerdownAt0.clientX = 0;
      pointerdownAt0.clientY = 0;
      expect(defaultHandler.isMoving_(pointerdownAt0)).toBe(false);
    });

    test('is moving if distance is 2', () => {
      const pointerdownAt2 = new Event();
      pointerdownAt2.type = 'pointerdown';
      pointerdownAt2.clientX = DEVICE_PIXEL_RATIO + 1;
      pointerdownAt2.clientY = DEVICE_PIXEL_RATIO + 1;
      expect(defaultHandler.isMoving_(pointerdownAt2)).toBe(true);
    });

    test('is moving with negative distance', () => {
      const pointerdownAt2 = new Event();
      pointerdownAt2.type = 'pointerdown';
      pointerdownAt2.clientX = -(DEVICE_PIXEL_RATIO + 1);
      pointerdownAt2.clientY = -(DEVICE_PIXEL_RATIO + 1);
      expect(defaultHandler.isMoving_(pointerdownAt2)).toBe(true);
    });

    test('is not moving if distance is less than move tolerance', () => {
      const pointerdownAt2 = new Event();
      pointerdownAt2.type = 'pointerdown';
      pointerdownAt2.clientX = DEVICE_PIXEL_RATIO + 1;
      pointerdownAt2.clientY = DEVICE_PIXEL_RATIO + 1;
      expect(moveToleranceHandler.isMoving_(pointerdownAt2)).toBe(false);
    });

    test('is moving if distance is greater than move tolerance', () => {
      const pointerdownAt9 = new Event();
      pointerdownAt9.type = 'pointerdown';
      pointerdownAt9.clientX = (DEVICE_PIXEL_RATIO * 8) + 1;
      pointerdownAt9.clientY = (DEVICE_PIXEL_RATIO * 8) + 1;
      expect(moveToleranceHandler.isMoving_(pointerdownAt9)).toBe(true);
    });

    test('is moving when moving back close to the down pixel', () => {
      const pointermoveAt9 = new Event();
      pointermoveAt9.type = 'pointermove';
      pointermoveAt9.clientX = (DEVICE_PIXEL_RATIO * 8) + 1;
      pointermoveAt9.clientY = (DEVICE_PIXEL_RATIO * 8) + 1;
      moveToleranceHandler.handlePointerMove_(pointermoveAt9);
      expect(moveToleranceHandler.isMoving_(pointermoveAt9)).toBe(true);
      const pointermoveAt2 = new Event();
      pointermoveAt2.type = 'pointermove';
      pointermoveAt2.clientX = DEVICE_PIXEL_RATIO + 1;
      pointermoveAt2.clientY = DEVICE_PIXEL_RATIO + 1;
      moveToleranceHandler.handlePointerMove_(pointermoveAt2);
      expect(moveToleranceHandler.isMoving_(pointermoveAt2)).toBe(true);
    });
  });
});
