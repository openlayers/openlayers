import Layer from '../../../../../src/ol/layer/Layer.js';
import Map from '../../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../../src/ol/MapBrowserEvent.js';
import MapBrowserEventHandler from '../../../../../src/ol/MapBrowserEventHandler.js';
import OlEvent from '../../../../../src/ol/events/Event.js';
import PointerInteraction from '../../../../../src/ol/interaction/Pointer.js';
import View from '../../../../../src/ol/View.js';

describe('ol/interaction/Pointer', function () {
  describe('#handleEvent', function () {
    let event;
    let defaultPrevented;

    beforeEach(function () {
      const type = 'pointerdown';
      const pointerEvent = new OlEvent();
      pointerEvent.type = type;
      pointerEvent.pointerId = 0;
      pointerEvent.preventDefault = function () {
        defaultPrevented = true;
      };
      event = new MapBrowserEvent(type, new Map(), pointerEvent);
      defaultPrevented = false;
    });

    it('does not prevent default on handled down event', function () {
      const interaction = new PointerInteraction({
        handleDownEvent: function () {
          return true;
        },
      });
      interaction.handleEvent(event);
      expect(defaultPrevented).to.be(false);
    });

    it('does not prevent default on unhandled down event', function () {
      const interaction = new PointerInteraction({
        handleDownEvent: function () {
          return false;
        },
      });
      interaction.handleEvent(event);
      expect(defaultPrevented).to.be(false);
    });
  });

  describe('event handlers', function () {
    let handleDownCalled, handleDragCalled, handleMoveCalled, handleUpCalled;

    const flagHandleDown = function () {
      handleDownCalled = true;
    };

    const flagHandleDrag = function () {
      handleDragCalled = true;
    };

    const flagHandleMove = function () {
      handleMoveCalled = true;
    };

    const flagHandleUp = function () {
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

    beforeEach(function () {
      handleDownCalled = false;
      handleDragCalled = false;
      handleMoveCalled = false;
      handleUpCalled = false;
    });

    it('has default event handlers', function () {
      const interaction = new PointerInteraction({});
      expect(interaction.handleDownEvent()).to.be(false);
      expect(interaction.handleUpEvent()).to.be(false);
    });

    it('allows event handler overrides via options', function () {
      const interaction = new PointerInteraction({
        handleDownEvent: flagHandleDown,
        handleDragEvent: flagHandleDrag,
        handleMoveEvent: flagHandleMove,
        handleUpEvent: flagHandleUp,
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

    it('allows event handler overrides via class extension', function () {
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

  describe("With a map's MapBrowserEventHandler", function () {
    let target, interaction, element, down1, down2, up1, up2;
    beforeEach(function () {
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      interaction = new PointerInteraction({});
      const handler = new MapBrowserEventHandler(
        new Map({
          target: target,
          layers: [
            new Layer({
              render: () => {},
            }),
          ],
          interactions: [interaction],
          view: new View({
            center: [0, 0],
            zoom: 0,
          }),
        })
      );
      handler.map_.renderSync();
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
      up1.pointerId = 1;
      up2 = new Event('pointerup', {target: element.firstChild});
      up2.clientX = 0;
      up2.clientY = 0;
      up2.button = 0;
      up2.pointerId = 2;
    });

    afterEach(function () {
      document.body.removeChild(target);
    });

    it('tracks pointers correctly', function () {
      element.dispatchEvent(down1);
      element.dispatchEvent(down2);
      expect(interaction.targetPointers[0].pointerId).to.be(1);
      expect(interaction.targetPointers[1].pointerId).to.be(2);
      document.dispatchEvent(up1);
      document.dispatchEvent(up2);
      expect(interaction.targetPointers).to.have.length(0);
    });
  });
});
