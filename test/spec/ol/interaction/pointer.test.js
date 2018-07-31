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

});
