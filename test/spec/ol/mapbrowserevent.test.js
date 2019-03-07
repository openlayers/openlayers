import Map from '../../../src/ol/Map.js';
import MapBrowserEventHandler from '../../../src/ol/MapBrowserEventHandler.js';
import {listen} from '../../../src/ol/events.js';
import {DEVICE_PIXEL_RATIO} from '../../../src/ol/has.js';
import PointerEvent from '../../../src/ol/pointer/PointerEvent.js';

describe('ol.MapBrowserEventHandler', function() {
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
      handler.emulateClick_(new PointerEvent('pointerdown', {
        type: 'mousedown',
        target: target,
        clientX: 0,
        clientY: 0
      }));
      expect(clickSpy.called).to.be.ok();
    });

    it('emulates singleclick', function() {
      handler.emulateClick_(new PointerEvent('pointerdown', {
        type: 'mousedown',
        target: target,
        clientX: 0,
        clientY: 0
      }));
      expect(singleclickSpy.called).to.not.be.ok();
      expect(dblclickSpy.called).to.not.be.ok();

      clock.tick(250);
      expect(singleclickSpy.calledOnce).to.be.ok();
      expect(dblclickSpy.called).to.not.be.ok();

      handler.emulateClick_(new PointerEvent('pointerdown', {
        type: 'mousedown',
        target: target,
        clientX: 0,
        clientY: 0
      }));
      expect(singleclickSpy.calledOnce).to.be.ok();
      expect(dblclickSpy.called).to.not.be.ok();
    });

    it('emulates dblclick', function() {
      handler.emulateClick_(new PointerEvent('pointerdown', {
        type: 'mousedown',
        target: target,
        clientX: 0,
        clientY: 0
      }));
      expect(singleclickSpy.called).to.not.be.ok();
      expect(dblclickSpy.called).to.not.be.ok();

      handler.emulateClick_(new PointerEvent('pointerdown', {
        type: 'mousedown',
        target: target,
        clientX: 0,
        clientY: 0
      }));
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
      const event = new PointerEvent('pointerdown', {});
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
      pointerdownAt0 = new PointerEvent('pointerdown', {}, {
        clientX: 0,
        clientY: 0
      });
      defaultHandler.handlePointerDown_(pointerdownAt0);
      moveToleranceHandler.handlePointerDown_(pointerdownAt0);
    });

    it('is not moving if distance is 0', function() {
      const pointerdownAt0 = new PointerEvent('pointerdown', {}, {
        clientX: 0,
        clientY: 0
      });
      expect(defaultHandler.isMoving_(pointerdownAt0)).to.be(false);
    });

    it('is moving if distance is 2', function() {
      const pointerdownAt2 = new PointerEvent('pointerdown', {}, {
        clientX: DEVICE_PIXEL_RATIO + 1,
        clientY: DEVICE_PIXEL_RATIO + 1
      });
      expect(defaultHandler.isMoving_(pointerdownAt2)).to.be(true);
    });

    it('is moving with negative distance', function() {
      const pointerdownAt2 = new PointerEvent('pointerdown', {}, {
        clientX: -(DEVICE_PIXEL_RATIO + 1),
        clientY: -(DEVICE_PIXEL_RATIO + 1)
      });
      expect(defaultHandler.isMoving_(pointerdownAt2)).to.be(true);
    });

    it('is not moving if distance is less than move tolerance', function() {
      const pointerdownAt2 = new PointerEvent('pointerdown', {}, {
        clientX: DEVICE_PIXEL_RATIO + 1,
        clientY: DEVICE_PIXEL_RATIO + 1
      });
      expect(moveToleranceHandler.isMoving_(pointerdownAt2)).to.be(false);
    });

    it('is moving if distance is greater than move tolerance', function() {
      const pointerdownAt9 = new PointerEvent('pointerdown', {}, {
        clientX: (DEVICE_PIXEL_RATIO * 8) + 1,
        clientY: (DEVICE_PIXEL_RATIO * 8) + 1
      });
      expect(moveToleranceHandler.isMoving_(pointerdownAt9)).to.be(true);
    });

    it('is moving when moving back close to the down pixel', function() {
      const pointermoveAt9 = new PointerEvent('pointermove', {}, {
        clientX: (DEVICE_PIXEL_RATIO * 8) + 1,
        clientY: (DEVICE_PIXEL_RATIO * 8) + 1
      });
      moveToleranceHandler.handlePointerMove_(pointermoveAt9);
      expect(moveToleranceHandler.isMoving_(pointermoveAt9)).to.be(true);
      const pointermoveAt2 = new PointerEvent('pointermove', {}, {
        clientX: DEVICE_PIXEL_RATIO + 1,
        clientY: DEVICE_PIXEL_RATIO + 1
      });
      moveToleranceHandler.handlePointerMove_(pointermoveAt2);
      expect(moveToleranceHandler.isMoving_(pointermoveAt2)).to.be(true);
    });
  });
});
