

goog.require('ol.Map');
goog.require('ol.MapBrowserEventHandler');
goog.require('ol.events');
goog.require('ol.has');
goog.require('ol.pointer.PointerEvent');

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
      handler = new ol.MapBrowserEventHandler(new ol.Map({
        target: target
      }));

      clickSpy = sinon.spy();
      ol.events.listen(handler, 'click', clickSpy);

      singleclickSpy = sinon.spy();
      ol.events.listen(handler, 'singleclick', singleclickSpy);

      dblclickSpy = sinon.spy();
      ol.events.listen(handler, 'dblclick', dblclickSpy);

    });

    afterEach(function() {
      clock.restore();
    });

    it('emulates click', function() {
      handler.emulateClick_(new ol.pointer.PointerEvent('pointerdown', {
        type: 'mousedown',
        target: target,
        clientX: 0,
        clientY: 0
      }));
      expect(clickSpy.called).to.be.ok();
    });

    it('emulates singleclick', function() {
      handler.emulateClick_(new ol.pointer.PointerEvent('pointerdown', {
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

      handler.emulateClick_(new ol.pointer.PointerEvent('pointerdown', {
        type: 'mousedown',
        target: target,
        clientX: 0,
        clientY: 0
      }));
      expect(singleclickSpy.calledOnce).to.be.ok();
      expect(dblclickSpy.called).to.not.be.ok();
    });

    it('emulates dblclick', function() {
      handler.emulateClick_(new ol.pointer.PointerEvent('pointerdown', {
        type: 'mousedown',
        target: target,
        clientX: 0,
        clientY: 0
      }));
      expect(singleclickSpy.called).to.not.be.ok();
      expect(dblclickSpy.called).to.not.be.ok();

      handler.emulateClick_(new ol.pointer.PointerEvent('pointerdown', {
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
      handler = new ol.MapBrowserEventHandler(new ol.Map({}));
    });

    it('is null if no "down" type event has been handled', function() {
      expect(handler.down_).to.be(null);
    });

    it('is an event after handlePointerDown_ has been called', function() {
      var event = new ol.pointer.PointerEvent('pointerdown', {});
      handler.handlePointerDown_(event);
      expect(handler.down_).to.be(event);
    });

  });

  describe('#isMoving_', function() {
    var defaultHandler;
    var moveToleranceHandler;
    var pointerdownAt0;
    beforeEach(function() {
      defaultHandler = new ol.MapBrowserEventHandler(new ol.Map({}));
      moveToleranceHandler = new ol.MapBrowserEventHandler(new ol.Map({}), 8);
      pointerdownAt0 = new ol.pointer.PointerEvent('pointerdown', {}, {
        clientX: 0,
        clientY: 0
      });
      defaultHandler.handlePointerDown_(pointerdownAt0);
      moveToleranceHandler.handlePointerDown_(pointerdownAt0);
    });

    it('is not moving if distance is 0', function() {
      var pointerdownAt0 = new ol.pointer.PointerEvent('pointerdown', {}, {
        clientX: 0,
        clientY: 0
      });
      expect(defaultHandler.isMoving_(pointerdownAt0)).to.be(false);
    });

    it('is moving if distance is 2', function() {
      var pointerdownAt2 = new ol.pointer.PointerEvent('pointerdown', {}, {
        clientX: ol.has.DEVICE_PIXEL_RATIO + 1,
        clientY: ol.has.DEVICE_PIXEL_RATIO + 1
      });
      expect(defaultHandler.isMoving_(pointerdownAt2)).to.be(true);
    });

    it('is moving with negative distance', function() {
      var pointerdownAt2 = new ol.pointer.PointerEvent('pointerdown', {}, {
        clientX: -(ol.has.DEVICE_PIXEL_RATIO + 1),
        clientY: -(ol.has.DEVICE_PIXEL_RATIO + 1)
      });
      expect(defaultHandler.isMoving_(pointerdownAt2)).to.be(true);
    });

    it('is not moving if distance is less than move tolerance', function() {
      var pointerdownAt2 = new ol.pointer.PointerEvent('pointerdown', {}, {
        clientX: ol.has.DEVICE_PIXEL_RATIO + 1,
        clientY: ol.has.DEVICE_PIXEL_RATIO + 1
      });
      expect(moveToleranceHandler.isMoving_(pointerdownAt2)).to.be(false);
    });

    it('is moving if distance is greater than move tolerance', function() {
      var pointerdownAt9 = new ol.pointer.PointerEvent('pointerdown', {}, {
        clientX: (ol.has.DEVICE_PIXEL_RATIO * 8) + 1,
        clientY: (ol.has.DEVICE_PIXEL_RATIO * 8) + 1
      });
      expect(moveToleranceHandler.isMoving_(pointerdownAt9)).to.be(true);
    });
  });
});
