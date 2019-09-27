import {assert} from 'chai';
import {spy as sinonSpy, useFakeTimers} from 'sinon';
import Map from '../../../../src/ol/Map.js';
import MapBrowserEventHandler from '../../../../src/ol/MapBrowserEventHandler.js';
import {listen} from '../../../../src/ol/events.js';
import OlEvent from '../../../../src/ol/events/Event.js';
import {DEVICE_PIXEL_RATIO} from '../../../../src/ol/has.js';

describe('ol/MapBrowserEventHandler', function () {
  describe('#emulateClick_', function () {
    let clock;
    let handler;
    let clickSpy;
    let singleclickSpy;
    let dblclickSpy;
    let target;

    beforeEach(function () {
      clock = useFakeTimers();
      target = document.createElement('div');
      handler = new MapBrowserEventHandler(
        new Map({
          target: target,
        }),
      );

      clickSpy = sinonSpy();
      listen(handler, 'click', clickSpy);

      singleclickSpy = sinonSpy();
      listen(handler, 'singleclick', singleclickSpy);

      dblclickSpy = sinonSpy();
      listen(handler, 'dblclick', dblclickSpy);
    });

    afterEach(function () {
      clock.restore();
    });

    it('emulates click', function () {
      const event = new OlEvent();
      event.type = 'pointerdown';
      (event.target = target), (event.clientX = 0);
      event.clientY = 0;
      handler.emulateClick_(event);
      assert.isOk(clickSpy.called);
    });

    it('emulates singleclick', function () {
      const event = new OlEvent();
      event.type = 'pointerdown';
      event.target = target;
      event.clientX = 0;
      event.clientY = 0;
      handler.emulateClick_(event);
      assert.isNotOk(singleclickSpy.called);
      assert.isNotOk(dblclickSpy.called);

      clock.tick(250);
      assert.isOk(singleclickSpy.calledOnce);
      assert.isNotOk(dblclickSpy.called);

      handler.emulateClick_(event);
      assert.isOk(singleclickSpy.calledOnce);
      assert.isNotOk(dblclickSpy.called);
    });

    it('emulates dblclick', function () {
      const event = new OlEvent();
      event.type = 'pointerdown';
      event.target = target;
      event.clientX = 0;
      event.clientY = 0;
      handler.emulateClick_(event);
      assert.isNotOk(singleclickSpy.called);
      assert.isNotOk(dblclickSpy.called);

      handler.emulateClick_(event);
      assert.isNotOk(singleclickSpy.called);
      assert.isOk(dblclickSpy.calledOnce);

      clock.tick(250);
      assert.isNotOk(singleclickSpy.called);
      assert.isOk(dblclickSpy.calledOnce);
    });
  });

  describe('#down_', function () {
    let handler;
    beforeEach(function () {
      handler = new MapBrowserEventHandler(new Map({}));
    });

    it('is null if no "down" type event has been handled', function () {
      assert.strictEqual(handler.down_, null);
    });

    it('is properly set after handlePointerDown_ has been called', function () {
      const event = new OlEvent('pointerdown');
      event.clientX = 42;
      event.clientY = 666;
      event.target = 'foo';
      handler.handlePointerDown_(event);
      assert.strictEqual(handler.down_.type, 'pointerdown');
      assert.strictEqual(handler.down_.clientX, 42);
      assert.strictEqual(handler.down_.clientY, 666);
      assert.strictEqual(handler.down_.target, 'foo');
    });
  });

  describe('#isMoving_', function () {
    let defaultHandler;
    let moveToleranceHandler;
    let pointerdownAt0;
    beforeEach(function () {
      defaultHandler = new MapBrowserEventHandler(new Map({}));
      moveToleranceHandler = new MapBrowserEventHandler(new Map({}), 8);
      pointerdownAt0 = new OlEvent();
      pointerdownAt0.type = 'pointerdown';
      pointerdownAt0.clientX = 0;
      pointerdownAt0.clientY = 0;
      defaultHandler.handlePointerDown_(pointerdownAt0);
      moveToleranceHandler.handlePointerDown_(pointerdownAt0);
    });

    it('is not moving if distance is 0', function () {
      pointerdownAt0 = new OlEvent();
      pointerdownAt0.type = 'pointerdown';
      pointerdownAt0.clientX = 0;
      pointerdownAt0.clientY = 0;
      assert.strictEqual(defaultHandler.isMoving_(pointerdownAt0), false);
    });

    it('is moving if distance is 2', function () {
      const pointerdownAt2 = new OlEvent();
      pointerdownAt2.type = 'pointerdown';
      pointerdownAt2.clientX = DEVICE_PIXEL_RATIO + 1;
      pointerdownAt2.clientY = DEVICE_PIXEL_RATIO + 1;
      assert.strictEqual(defaultHandler.isMoving_(pointerdownAt2), true);
    });

    it('is moving with negative distance', function () {
      const pointerdownAt2 = new OlEvent();
      pointerdownAt2.type = 'pointerdown';
      pointerdownAt2.clientX = -(DEVICE_PIXEL_RATIO + 1);
      pointerdownAt2.clientY = -(DEVICE_PIXEL_RATIO + 1);
      assert.strictEqual(defaultHandler.isMoving_(pointerdownAt2), true);
    });

    it('is not moving if distance is less than move tolerance', function () {
      const pointerdownAt2 = new OlEvent();
      pointerdownAt2.type = 'pointerdown';
      pointerdownAt2.clientX = DEVICE_PIXEL_RATIO + 1;
      pointerdownAt2.clientY = DEVICE_PIXEL_RATIO + 1;
      assert.strictEqual(moveToleranceHandler.isMoving_(pointerdownAt2), false);
    });

    it('is moving if distance is greater than move tolerance', function () {
      const pointerdownAt9 = new OlEvent();
      pointerdownAt9.type = 'pointerdown';
      pointerdownAt9.clientX = DEVICE_PIXEL_RATIO * 8 + 1;
      pointerdownAt9.clientY = DEVICE_PIXEL_RATIO * 8 + 1;
      assert.strictEqual(moveToleranceHandler.isMoving_(pointerdownAt9), true);
    });

    it('is moving when moving back close to the down pixel', function () {
      const pointermoveAt9 = new OlEvent();
      pointermoveAt9.type = 'pointermove';
      pointermoveAt9.clientX = DEVICE_PIXEL_RATIO * 8 + 1;
      pointermoveAt9.clientY = DEVICE_PIXEL_RATIO * 8 + 1;
      moveToleranceHandler.handlePointerMove_(pointermoveAt9);
      assert.strictEqual(moveToleranceHandler.isMoving_(pointermoveAt9), true);
      const pointermoveAt2 = new OlEvent();
      pointermoveAt2.type = 'pointermove';
      pointermoveAt2.clientX = DEVICE_PIXEL_RATIO + 1;
      pointermoveAt2.clientY = DEVICE_PIXEL_RATIO + 1;
      moveToleranceHandler.handlePointerMove_(pointermoveAt2);
      assert.strictEqual(moveToleranceHandler.isMoving_(pointermoveAt2), true);
    });
  });

  describe('handleTouchMove_', function () {
    let handler;
    beforeEach(function () {
      handler = new MapBrowserEventHandler(new Map({}));
    });
    it('prevents default on touchmove event', function () {
      handler.originalPointerMoveEvent_ = {
        defaultPrevented: true,
      };
      const event = {
        preventDefault: sinonSpy(),
      };
      handler.handleTouchMove_(event);
      assert.strictEqual(event.preventDefault.callCount, 1);
    });
  });

  describe('dblclick', function () {
    let clock;
    let handler;
    let clickSpy;
    let singleclickSpy;
    let dblclickSpy;
    let target;
    let element, down1, down2, up1, up2;

    beforeEach(function () {
      clock = useFakeTimers();
      target = document.createElement('div');
      handler = new MapBrowserEventHandler(
        new Map({
          target: target,
        }),
      );

      element = handler.element_;
      down1 = new Event('pointerdown', {target: element});
      down1.clientX = 0;
      down1.clientY = 0;
      down1.button = 0;
      down1.pointerId = 1;
      down2 = new Event('pointerdown', {target: element});
      down2.clientX = 0;
      down2.clientY = 0;
      down2.button = 0;
      down2.pointerId = 2;
      up1 = new Event('pointerup', {target: element});
      up1.clientX = 0;
      up1.clientY = 0;
      up1.button = 0;
      up1.pointerId = 1;
      up2 = new Event('pointerup', {target: element});
      up2.clientX = 0;
      up2.clientY = 0;
      up2.button = 0;
      up2.pointerId = 2;

      clickSpy = sinonSpy();
      listen(handler, 'click', clickSpy);

      singleclickSpy = sinonSpy();
      listen(handler, 'singleclick', singleclickSpy);

      dblclickSpy = sinonSpy();
      listen(handler, 'dblclick', dblclickSpy);
    });

    afterEach(function () {
      clock.restore();
    });

    it('emulates dblclick', function () {
      element.dispatchEvent(down1);
      document.dispatchEvent(up1);
      assert.isNotOk(singleclickSpy.called);
      assert.isNotOk(dblclickSpy.called);

      element.dispatchEvent(down2);
      document.dispatchEvent(up2);
      assert.isNotOk(singleclickSpy.called);
      assert.isOk(dblclickSpy.called);

      clock.tick(250);
      assert.isNotOk(singleclickSpy.called);
      assert.isOk(dblclickSpy.called);
    });

    it('does not emulate dblclick and singleclick when multiple pointers are active', function () {
      element.dispatchEvent(down1);
      element.dispatchEvent(down2);
      assert.isNotOk(singleclickSpy.called);
      assert.isNotOk(dblclickSpy.called);

      document.dispatchEvent(up1);
      document.dispatchEvent(up2);
      assert.isNotOk(singleclickSpy.called);
      assert.isNotOk(dblclickSpy.called);

      clock.tick(250);
      assert.isNotOk(singleclickSpy.called);
      assert.isNotOk(dblclickSpy.called);
    });
  });

  describe('Event target change', function () {
    let target, handler, element, down1, down2, up1, up2;
    beforeEach(function () {
      target = document.createElement('div');
      handler = new MapBrowserEventHandler(
        new Map({
          target: target,
        }),
      );

      element = handler.element_;
      down1 = new Event('pointerdown', {target: element});
      down1.clientX = 0;
      down1.clientY = 0;
      down1.button = 0;
      down1.pointerId = 1;
      down2 = new Event('pointerdown', {target: element});
      down2.clientX = 0;
      down2.clientY = 0;
      down2.button = 0;
      down2.pointerId = 2;
      up1 = new Event('pointerup', {target: element.firstChild});
      up1.clientX = 0;
      up1.clientY = 0;
      up1.button = 0;
      up1.pointerId = 3;
      up2 = new Event('pointerup', {target: element.firstChild});
      up2.clientX = 0;
      up2.clientY = 0;
      up2.button = 0;
      up2.pointerId = 4;
    });

    it('keeps activePointers up to date when event target changes', function () {
      element.dispatchEvent(down1);
      element.dispatchEvent(down2);
      assert.strictEqual(handler.activePointers_[0].pointerId, 1);
      assert.strictEqual(handler.activePointers_[1].pointerId, 2);
      document.dispatchEvent(up1);
      document.dispatchEvent(up2);
      assert.lengthOf(handler.activePointers_, 0);
    });
  });
});
