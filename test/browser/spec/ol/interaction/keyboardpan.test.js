import {assert} from 'chai';
import Map from '../../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../../src/ol/MapBrowserEvent.js';
import View from '../../../../../src/ol/View.js';
import Event from '../../../../../src/ol/events/Event.js';

describe('ol.interaction.KeyboardPan', function () {
  let map;

  beforeEach(function () {
    map = new Map({
      target: createMapDiv(100, 100),
      view: new View({
        center: [0, 0],
        resolutions: [1],
        zoom: 0,
      }),
    });
    map.renderSync();
  });
  afterEach(function () {
    disposeMap(map);
  });

  describe('handleEvent()', function () {
    it('pans on arrow keys', function () {
      const view = map.getView();
      const spy = vi.spyOn(view, 'animateInternal');
      const event = new MapBrowserEvent('keydown', map, {
        type: 'keydown',
        target: map.getTargetElement(),
        preventDefault: Event.prototype.preventDefault,
      });

      event.originalEvent.key = 'ArrowDown';
      map.handleMapBrowserEvent(event);
      assert.deepEqual(spy.mock.calls[0][0].center, [0, -128]);
      view.setCenter([0, 0]);

      event.originalEvent.key = 'ArrowUp';
      map.handleMapBrowserEvent(event);
      assert.deepEqual(spy.mock.calls[1][0].center, [0, 128]);
      view.setCenter([0, 0]);

      event.originalEvent.key = 'ArrowLeft';
      map.handleMapBrowserEvent(event);
      assert.deepEqual(spy.mock.calls[2][0].center, [-128, 0]);
      view.setCenter([0, 0]);

      event.originalEvent.key = 'ArrowRight';
      map.handleMapBrowserEvent(event);
      assert.deepEqual(spy.mock.calls[3][0].center, [128, 0]);
      view.setCenter([0, 0]);

      spy.mockRestore();
    });
  });

  describe('handleEvent with map in ShadowRoot', function () {
    let olMap;
    let customMapEl;
    const options = {
      altShiftDragRotate: false,
      doubleClickZoom: false,
      keyboard: true,
      mouseWheelZoom: false,
      shiftDragZoom: false,
      dragPan: false,
      pinchRotate: false,
      pinchZoom: false,
      onFocusOnly: true,
    };

    defineCustomMapEl({interactionOpts: options});

    beforeEach(function () {
      // create custom ol-map element and add to body
      customMapEl = document.createElement('ol-map');
      customMapEl.setAttribute('tabindex', '0');
      customMapEl.style.position = 'absolute';
      customMapEl.style.left = '-1000px';
      customMapEl.style.top = '-1000px';
      customMapEl.style.width = '100px';
      customMapEl.style.height = '100px';
      document.body.appendChild(customMapEl);

      olMap = customMapEl.map;
      olMap.renderSync();
    });

    afterEach(() => {
      disposeMap(olMap);
      customMapEl.remove();
    });

    it('pans on arrow keys', () =>
      new Promise((resolve) => {
        // we have to wait until the map is rendered
        olMap.on('rendercomplete', () => {
          const view = olMap.getView();
          const spy = vi.spyOn(view, 'animateInternal');
          const event = new MapBrowserEvent('keydown', olMap, {
            type: 'keydown',
            target: customMapEl,
            preventDefault: Event.prototype.preventDefault,
          });

          event.originalEvent.key = 'ArrowDown';
          olMap.handleMapBrowserEvent(event);
          assert.deepEqual(spy.mock.calls[0][0].center, [0, -128]);
          view.setCenter([0, 0]);

          event.originalEvent.key = 'ArrowUp';
          map.handleMapBrowserEvent(event);
          assert.deepEqual(spy.mock.calls[1][0].center, [0, 128]);
          view.setCenter([0, 0]);

          event.originalEvent.key = 'ArrowLeft';
          map.handleMapBrowserEvent(event);
          assert.deepEqual(spy.mock.calls[2][0].center, [-128, 0]);
          view.setCenter([0, 0]);

          event.originalEvent.key = 'ArrowRight';
          map.handleMapBrowserEvent(event);
          assert.deepEqual(spy.mock.calls[3][0].center, [128, 0]);
          view.setCenter([0, 0]);

          spy.mockRestore();

          resolve();
        });
      }));
  });
});
