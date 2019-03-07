import Map from '../../../../src/ol/Map.js';
import MapBrowserPointerEvent from '../../../../src/ol/MapBrowserPointerEvent.js';
import PointerEvent from '../../../../src/ol/pointer/PointerEvent.js';
import PointerInteraction from '../../../../src/ol/interaction/Pointer.js';

describe('ol.interaction.Pointer', function() {

  describe('#handleEvent', function() {

    let event;
    let defaultPrevented;

    beforeEach(function() {
      const type = 'pointerdown';
      const pointerEvent = new PointerEvent(type, {
        type: type,
        preventDefault: function() {
          defaultPrevented = true;
        }
      });
      event = new MapBrowserPointerEvent(type, new Map(), pointerEvent);
      defaultPrevented = false;
    });

    it('prevents default on handled down event', function() {
      const interaction = new PointerInteraction({
        handleDownEvent: function() {
          return true;
        }
      });
      interaction.handleEvent(event);
      expect(defaultPrevented).to.be(true);
    });

    it('does not prevent default on unhandled down event', function() {
      const interaction = new PointerInteraction({
        handleDownEvent: function() {
          return false;
        }
      });
      interaction.handleEvent(event);
      expect(defaultPrevented).to.be(false);
    });

  });

  describe('event handlers', function() {
    let handleDownCalled, handleDragCalled, handleMoveCalled, handleUpCalled;

    const flagHandleDown = function() {
      handleDownCalled = true;
    };

    const flagHandleDrag = function() {
      handleDragCalled = true;
    };

    const flagHandleMove = function() {
      handleMoveCalled = true;
    };

    const flagHandleUp = function() {
      handleUpCalled = true;
    };

    class MockPointerInteraction extends PointerInteraction {
      constructor() {
        super(...arguments);
      }
      handleDownEvent(mapBrowserEvent) {
        flagHandleDown();
        return super.handleDownEvent(mapBrowserEvent);
      }
      handleDragEvent(mapBrowserEvent) {
        flagHandleDrag();
      }
      handleMoveEvent(mapBrowserEvent) {
        flagHandleMove();
      }
      handleUpEvent(mapBrowserEvent) {
        flagHandleUp();
        return super.handleUpEvent(mapBrowserEvent);
      }
    }

    beforeEach(function() {
      handleDownCalled = false;
      handleDragCalled = false;
      handleMoveCalled = false;
      handleUpCalled = false;
    });

    it('has default event handlers', function() {
      const interaction = new PointerInteraction({});
      expect(interaction.handleDownEvent()).to.be(false);
      expect(interaction.handleUpEvent()).to.be(false);
    });

    it('allows event handler overrides via options', function() {
      const interaction = new PointerInteraction({
        handleDownEvent: flagHandleDown,
        handleDragEvent: flagHandleDrag,
        handleMoveEvent: flagHandleMove,
        handleUpEvent: flagHandleUp
      });

      interaction.handleDownEvent();
      expect(handleDownCalled).to.be(true);

      interaction.handleDragEvent();
      expect(handleDragCalled).to.be(true);

      interaction.handleMoveEvent();
      expect(handleMoveCalled).to.be(true);

      interaction.handleUpEvent();
      expect(handleUpCalled).to.be(true);
    });

    it('allows event handler overrides via class extension', function() {
      const interaction = new MockPointerInteraction({});

      interaction.handleDownEvent();
      expect(handleDownCalled).to.be(true);

      interaction.handleDragEvent();
      expect(handleDragCalled).to.be(true);

      interaction.handleMoveEvent();
      expect(handleMoveCalled).to.be(true);

      interaction.handleUpEvent();
      expect(handleUpCalled).to.be(true);
    });

  });

});
