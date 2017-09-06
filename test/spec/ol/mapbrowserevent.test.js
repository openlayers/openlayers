

import _ol_Map_ from '../../../src/ol/map';
import _ol_MapBrowserEventHandler_ from '../../../src/ol/mapbrowsereventhandler';
import _ol_events_ from '../../../src/ol/events';
import _ol_has_ from '../../../src/ol/has';
import _ol_pointer_PointerEvent_ from '../../../src/ol/pointer/pointerevent';

describe('ol.MapBrowserEventHandler', function() {
  describe('#emulateClick_', function() {
    var clock;
    var handler;
    var clickSpy;
    var singleclickSpy;
    var dblclickSpy;
    var target;

    beforeEach(function() {
      clock = sinon.useFakeTimers();
      target = document.createElement('DIV');
      handler = new _ol_MapBrowserEventHandler_(new _ol_Map_({
        target: target
      }));

      clickSpy = sinon.spy();
      _ol_events_.listen(handler, 'click', clickSpy);

      singleclickSpy = sinon.spy();
      _ol_events_.listen(handler, 'singleclick', singleclickSpy);

      dblclickSpy = sinon.spy();
      _ol_events_.listen(handler, 'dblclick', dblclickSpy);

    });

    afterEach(function() {
      clock.restore();
    });

    it('emulates click', function() {
      handler.emulateClick_(new _ol_pointer_PointerEvent_('pointerdown', {
        type: 'mousedown',
        target: target,
        clientX: 0,
        clientY: 0
      }));
      expect(clickSpy.called).to.be.ok();
    });

    it('emulates singleclick', function() {
      handler.emulateClick_(new _ol_pointer_PointerEvent_('pointerdown', {
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

      handler.emulateClick_(new _ol_pointer_PointerEvent_('pointerdown', {
        type: 'mousedown',
        target: target,
        clientX: 0,
        clientY: 0
      }));
      expect(singleclickSpy.calledOnce).to.be.ok();
      expect(dblclickSpy.called).to.not.be.ok();
    });

    it('emulates dblclick', function() {
      handler.emulateClick_(new _ol_pointer_PointerEvent_('pointerdown', {
        type: 'mousedown',
        target: target,
        clientX: 0,
        clientY: 0
      }));
      expect(singleclickSpy.called).to.not.be.ok();
      expect(dblclickSpy.called).to.not.be.ok();

      handler.emulateClick_(new _ol_pointer_PointerEvent_('pointerdown', {
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

    var handler;
    beforeEach(function() {
      handler = new _ol_MapBrowserEventHandler_(new _ol_Map_({}));
    });

    it('is null if no "down" type event has been handled', function() {
      expect(handler.down_).to.be(null);
    });

    it('is an event after handlePointerDown_ has been called', function() {
      var event = new _ol_pointer_PointerEvent_('pointerdown', {});
      handler.handlePointerDown_(event);
      expect(handler.down_).to.be(event);
    });

  });

  describe('#isMoving_', function() {
    var defaultHandler;
    var moveToleranceHandler;
    var pointerdownAt0;
    beforeEach(function() {
      defaultHandler = new _ol_MapBrowserEventHandler_(new _ol_Map_({}));
      moveToleranceHandler = new _ol_MapBrowserEventHandler_(new _ol_Map_({}), 8);
      pointerdownAt0 = new _ol_pointer_PointerEvent_('pointerdown', {}, {
        clientX: 0,
        clientY: 0
      });
      defaultHandler.handlePointerDown_(pointerdownAt0);
      moveToleranceHandler.handlePointerDown_(pointerdownAt0);
    });

    it('is not moving if distance is 0', function() {
      var pointerdownAt0 = new _ol_pointer_PointerEvent_('pointerdown', {}, {
        clientX: 0,
        clientY: 0
      });
      expect(defaultHandler.isMoving_(pointerdownAt0)).to.be(false);
    });

    it('is moving if distance is 2', function() {
      var pointerdownAt2 = new _ol_pointer_PointerEvent_('pointerdown', {}, {
        clientX: _ol_has_.DEVICE_PIXEL_RATIO + 1,
        clientY: _ol_has_.DEVICE_PIXEL_RATIO + 1
      });
      expect(defaultHandler.isMoving_(pointerdownAt2)).to.be(true);
    });

    it('is moving with negative distance', function() {
      var pointerdownAt2 = new _ol_pointer_PointerEvent_('pointerdown', {}, {
        clientX: -(_ol_has_.DEVICE_PIXEL_RATIO + 1),
        clientY: -(_ol_has_.DEVICE_PIXEL_RATIO + 1)
      });
      expect(defaultHandler.isMoving_(pointerdownAt2)).to.be(true);
    });

    it('is not moving if distance is less than move tolerance', function() {
      var pointerdownAt2 = new _ol_pointer_PointerEvent_('pointerdown', {}, {
        clientX: _ol_has_.DEVICE_PIXEL_RATIO + 1,
        clientY: _ol_has_.DEVICE_PIXEL_RATIO + 1
      });
      expect(moveToleranceHandler.isMoving_(pointerdownAt2)).to.be(false);
    });

    it('is moving if distance is greater than move tolerance', function() {
      var pointerdownAt9 = new _ol_pointer_PointerEvent_('pointerdown', {}, {
        clientX: (_ol_has_.DEVICE_PIXEL_RATIO * 8) + 1,
        clientY: (_ol_has_.DEVICE_PIXEL_RATIO * 8) + 1
      });
      expect(moveToleranceHandler.isMoving_(pointerdownAt9)).to.be(true);
    });
  });
});
