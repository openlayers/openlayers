import Map from '../../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../../src/ol/MapBrowserEvent.js';
import View from '../../../../../src/ol/View.js';
import {always} from '../../../../../src/ol/events/condition.js';
import DragBox from '../../../../../src/ol/interaction/DragBox.js';

describe('ol/interaction/DragBox', () => {
  let dragBox, map;

  const width = 100;
  const height = 100;

  /**
   * Simulates a browser event on the map viewport.  The client x/y location
   * will be adjusted as if the map were centered at 0,0.
   * @param {string} type Event type.
   * @param {number} x Horizontal offset from map center.
   * @param {number} y Vertical offset from map center.
   * @param {boolean} [opt_shiftKey] Shift key is pressed.
   * @param {boolean} [opt_pointerId] Pointer id.
   * @return {module:ol/MapBrowserEvent} The simulated event.
   */
  function simulateEvent(type, x, y, opt_shiftKey, opt_pointerId = 0) {
    const viewport = map.getViewport();
    // calculated in case body has top < 0 (test runner with small window)
    const position = viewport.getBoundingClientRect();
    const shiftKey = opt_shiftKey !== undefined ? opt_shiftKey : false;
    const event = {};
    event.type = type;
    event.target = viewport.firstChild;
    event.clientX = position.left + x + width / 2;
    event.clientY = position.top + y + height / 2;
    event.shiftKey = shiftKey;
    event.preventDefault = function () {};
    event.pointerType = 'mouse';
    event.pointerId = opt_pointerId;
    const simulatedEvent = new MapBrowserEvent(type, map, event);
    map.handleMapBrowserEvent(simulatedEvent);
    return simulatedEvent;
  }

  beforeEach((done) => {
    dragBox = new DragBox({
      condition: always,
    });
    map = new Map({
      target: createMapDiv(width, height),
      interactions: [],
      constrols: [],
      view: new View({
        center: [0, 0],
        zoom: 0,
      }),
    });
    map.once('rendercomplete', () => done());
  });

  afterEach(() => {
    disposeMap(map);
  });

  it('clears the drag box', (done) => {
    try {
      map.addInteraction(dragBox);
      simulateEvent('pointermove', 10, 10);
      simulateEvent('pointerdown', 10, 10);
      simulateEvent('pointerdrag', 20, 20);
      expect(dragBox.box_.map_).to.be(map);
      map.removeInteraction(dragBox);
      expect(dragBox.box_.map_).to.be(null);
      done();
    } catch (error) {
      done(error);
    }
  });
});
