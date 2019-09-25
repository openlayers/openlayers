import Map from '../../../../src/ol/Map.js';
import MapBrowserPointerEvent from '../../../../src/ol/MapBrowserPointerEvent.js';
import View from '../../../../src/ol/View.js';
import ExtentInteraction from '../../../../src/ol/interaction/Extent.js';
import Event from '../../../../src/ol/events/Event.js';

describe('ol.interaction.Extent', () => {
  let map, interaction;

  const width = 360;
  const height = 180;

  beforeEach(() => {
    const target = createMapDiv(width, height);

    map = new Map({
      target: target,
      layers: [],
      view: new View({
        projection: 'EPSG:4326',
        center: [0, 0],
        resolution: 1
      })
    });
    map.renderSync();

    interaction = new ExtentInteraction();
    map.addInteraction(interaction);
  });

  afterEach(() => {
    if (map) {
      disposeMap(map);
    }
    map = null;
    interaction = null;
  });

  /**
   * Simulates a browser event on the map viewport.  The client x/y location
   * will be adjusted as if the map were centered at 0,0.
   * @param {string} type Event type.
   * @param {number} x Horizontal offset from map center.
   * @param {number} y Vertical offset from map center.
   * @param {boolean=} opt_shiftKey Shift key is pressed.
   * @param {number} button The mouse button.
   */
  function simulateEvent(type, x, y, opt_shiftKey, button) {
    const viewport = map.getViewport();
    // calculated in case body has top < 0 (test runner with small window)
    const position = viewport.getBoundingClientRect();
    const shiftKey = opt_shiftKey !== undefined ? opt_shiftKey : false;
    const pointerEvent = new Event();
    pointerEvent.type = type;
    pointerEvent.button = button;
    pointerEvent.clientX = position.left + x + width / 2;
    pointerEvent.clientY = position.top - y + height / 2;
    pointerEvent.shiftKey = shiftKey;
    pointerEvent.pointerId = 0;
    pointerEvent.preventDefault = function() {};
    const event = new MapBrowserPointerEvent(type, map, pointerEvent);
    event.pointerEvent.pointerId = 1;
    map.handleMapBrowserEvent(event);
  }

  describe('Constructor', () => {

    test('can be configured with an extent', () => {
      expect(function() {
        new ExtentInteraction({
          extent: [-10, -10, 10, 10]
        });
      }).not.toThrow();
    });

  });

  describe('snap to vertex', () => {
    test('snap to vertex works', () => {
      interaction.setExtent([-50, -50, 50, 50]);

      expect(interaction.snapToVertex_([230, 40], map)).toEqual([50, 50]);
      expect(interaction.snapToVertex_([231, 41], map)).toEqual([50, 50]);
    });

    test('snap to edge works', () => {
      interaction.setExtent([-50, -50, 50, 50]);

      expect(interaction.snapToVertex_([230, 90], map)).toEqual([50, 0]);
      expect(interaction.snapToVertex_([230, 89], map)).toEqual([50, 1]);
      expect(interaction.snapToVertex_([231, 90], map)).toEqual([50, 0]);
    });
  });

  describe('draw extent', () => {

    test('drawing extent works', () => {
      simulateEvent('pointerdown', -50, -50, false, 0);
      simulateEvent('pointerdrag', 50, 50, false, 0);
      simulateEvent('pointerup', 50, 50, false, 0);

      expect(interaction.getExtent()).toEqual([-50, -50, 50, 50]);
    });

    test('clicking off extent nulls extent', () => {
      interaction.setExtent([-50, -50, 50, 50]);

      simulateEvent('pointerdown', -10, -10, false, 0);
      simulateEvent('pointerup', -10, -10, false, 0);

      expect(interaction.getExtent()).toBe(null);
    });

    test('clicking on extent does not null extent', () => {
      interaction.setExtent([-50, -50, 50, 50]);

      simulateEvent('pointerdown', 50, 50, false, 0);
      simulateEvent('pointerup', 50, 50, false, 0);

      expect(interaction.getExtent()).toEqual([-50, -50, 50, 50]);
    });

    test('snap and drag vertex works', () => {
      interaction.setExtent([-50, -50, 50, 50]);

      simulateEvent('pointerdown', 51, 49, false, 0);
      simulateEvent('pointerdrag', -70, -40, false, 0);
      simulateEvent('pointerup', -70, -40, false, 0);

      expect(interaction.getExtent()).toEqual([-70, -50, -50, -40]);
    });

    test('snap and drag edge works', () => {
      interaction.setExtent([-50, -50, 50, 50]);

      simulateEvent('pointerdown', 51, 5, false, 0);
      simulateEvent('pointerdrag', 20, -30, false, 0);
      simulateEvent('pointerup', 20, -30, false, 0);

      expect(interaction.getExtent()).toEqual([-50, -50, 20, 50]);
    });
  });
});
