import Map from '../../../../src/ol/Map.js';
import MapBrowserPointerEvent from '../../../../src/ol/MapBrowserPointerEvent.js';
import Event from '../../../../src/ol/events/Event.js';
import PointerInteraction from '../../../../src/ol/interaction/Pointer.js';

describe('ol.interaction.Pointer', () => {

  describe('#handleEvent', () => {

    let event;
    let defaultPrevented;

    beforeEach(() => {
      const type = 'pointerdown';
      const pointerEvent = new Event();
      pointerEvent.type = type;
      pointerEvent.pointerId = 0;
      pointerEvent.preventDefault = function() {
        defaultPrevented = true;
      };
      event = new MapBrowserPointerEvent(type, new Map(), pointerEvent);
      defaultPrevented = false;
    });

    test('prevents default on handled down event', () => {
      const interaction = new PointerInteraction({
        handleDownEvent: function() {
          return true;
        }
      });
      interaction.handleEvent(event);
      expect(defaultPrevented).toBe(true);
    });

    test('does not prevent default on unhandled down event', () => {
      const interaction = new PointerInteraction({
        handleDownEvent: function() {
          return false;
        }
      });
      interaction.handleEvent(event);
      expect(defaultPrevented).toBe(false);
    });

  });

  describe('event handlers', () => {
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

    beforeEach(() => {
      handleDownCalled = false;
      handleDragCalled = false;
      handleMoveCalled = false;
      handleUpCalled = false;
    });

    test('has default event handlers', () => {
      const interaction = new PointerInteraction({});
      expect(interaction.handleDownEvent()).toBe(false);
      expect(interaction.handleUpEvent()).toBe(false);
    });

    test('allows event handler overrides via options', () => {
      const interaction = new PointerInteraction({
        handleDownEvent: flagHandleDown,
        handleDragEvent: flagHandleDrag,
        handleMoveEvent: flagHandleMove,
        handleUpEvent: flagHandleUp
      });

      interaction.handleDownEvent();
      expect(handleDownCalled).toBe(true);

      interaction.handleDragEvent();
      expect(handleDragCalled).toBe(true);

      interaction.handleMoveEvent();
      expect(handleMoveCalled).toBe(true);

      interaction.handleUpEvent();
      expect(handleUpCalled).toBe(true);
    });

    test('allows event handler overrides via class extension', () => {
      const interaction = new MockPointerInteraction({});

      interaction.handleDownEvent();
      expect(handleDownCalled).toBe(true);

      interaction.handleDragEvent();
      expect(handleDragCalled).toBe(true);

      interaction.handleMoveEvent();
      expect(handleMoveCalled).toBe(true);

      interaction.handleUpEvent();
      expect(handleUpCalled).toBe(true);
    });

  });

});
