import {assert} from 'chai';
import Map from '../../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../../src/ol/MapBrowserEvent.js';
import View from '../../../../../src/ol/View.js';
import Event from '../../../../../src/ol/events/Event.js';
import MouseWheelZoom from '../../../../../src/ol/interaction/MouseWheelZoom.js';

describe('ol.interaction.MouseWheelZoom', function () {
  /** @type {Map} */
  let map;
  /** @type {MouseWheelZoom} */
  let interaction;

  beforeEach(function () {
    interaction = new MouseWheelZoom();
    map = new Map({
      target: createMapDiv(100, 100),
      interactions: [interaction],
      view: new View({
        center: [0, 0],
        resolutions: [2, 1, 0.5],
        zoom: 1,
      }),
    });
    map.renderSync();
  });

  afterEach(function () {
    disposeMap(map);
    map = null;
    interaction = null;
  });

  describe('timeout duration', function () {
    beforeEach(function () {
      vi.spyOn(interaction, 'handleWheelZoom_');
      vi.useFakeTimers();
    });

    afterEach(function () {
      vi.useRealTimers();
      interaction.handleWheelZoom_.mockRestore();
    });

    it('works with the default value', () =>
      new Promise((resolve) => {
        const event = new MapBrowserEvent('wheel', map, {
          type: 'wheel',
          target: map.getViewport(),
          preventDefault: Event.prototype.preventDefault,
        });

        map.handleMapBrowserEvent(event);
        vi.advanceTimersByTime(50);
        assert.strictEqual(interaction.handleWheelZoom_.mock.calls.length, 0);

        vi.advanceTimersByTime(30);
        assert.isAbove(interaction.handleWheelZoom_.mock.calls.length, 0);

        resolve();
      }));
  });

  describe('pinch-to-zoom vs ctrl+scroll', function () {
    /** @type {View} */
    let view;

    beforeEach(function () {
      view = map.getView();
      vi.spyOn(view, 'adjustZoom');
    });

    afterEach(function () {
      view.adjustZoom.mockRestore();
    });

    /**
     * @param {boolean} ctrlKey Whether the ctrl key is pressed.
     * @return {MapBrowserEvent} A trackpad wheel event.
     */
    function makeTrackpadWheelEvent(ctrlKey) {
      const event = new MapBrowserEvent('wheel', map, {
        type: 'wheel',
        deltaMode: WheelEvent.DOM_DELTA_PIXEL,
        deltaY: 1,
        ctrlKey: ctrlKey,
        target: map.getViewport(),
        preventDefault: Event.prototype.preventDefault,
      });
      event.coordinate = map.getView().getCenter();
      event.pixel = map.getPixelFromCoordinate(event.coordinate);
      return event;
    }

    it('applies 3x multiplier for pinch-to-zoom (ctrlKey synthesized by browser)', function () {
      map.handleMapBrowserEvent(makeTrackpadWheelEvent(true));
      assert.strictEqual(view.adjustZoom.mock.calls.length, 1);
      assert.approximately(view.adjustZoom.mock.calls[0][0], -3 / 300, 1e-10);
    });

    it('does not apply 3x multiplier when ctrl key is physically pressed', function () {
      document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Control'}));
      map.handleMapBrowserEvent(makeTrackpadWheelEvent(true));
      document.dispatchEvent(new KeyboardEvent('keyup', {key: 'Control'}));
      assert.strictEqual(view.adjustZoom.mock.calls.length, 1);
      assert.approximately(view.adjustZoom.mock.calls[0][0], -1 / 300, 1e-10);
    });
  });

  describe('handleEvent()', function () {
    it('works in DOM_DELTA_PIXEL mode (trackpad)', () =>
      new Promise((resolve) => {
        map.once('postrender', function () {
          assert.strictEqual(interaction.mode_, 'trackpad');
          resolve();
        });
        const event = new MapBrowserEvent('wheel', map, {
          type: 'wheel',
          deltaMode: WheelEvent.DOM_DELTA_PIXEL,
          deltaY: 1,
          target: map.getViewport(),
          preventDefault: Event.prototype.preventDefault,
        });
        event.coordinate = map.getView().getCenter();
        event.pixel = map.getPixelFromCoordinate(event.coordinate);
        map.handleMapBrowserEvent(event);
      }));

    describe('spying on view.animateInternal()', function () {
      let view;
      beforeEach(function () {
        view = map.getView();
        vi.spyOn(view, 'animateInternal');
      });

      afterEach(function () {
        view.animateInternal.mockRestore();
      });

      it('works in DOM_DELTA_LINE mode (wheel)', () =>
        new Promise((resolve) => {
          map.once('postrender', function () {
            const call = view.animateInternal.mock.calls[0];
            assert.strictEqual(call[0].resolution, 2);
            assert.deepEqual(call[0].anchor, map.getView().getCenter());
            resolve();
          });

          const event = new MapBrowserEvent('wheel', map, {
            type: 'wheel',
            deltaMode: WheelEvent.DOM_DELTA_LINE,
            deltaY: 20,
            target: map.getViewport(),
            preventDefault: Event.prototype.preventDefault,
          });
          event.coordinate = map.getView().getCenter();
          event.pixel = map.getPixelFromCoordinate(event.coordinate);

          map.handleMapBrowserEvent(event);
        }));

      it('works in DOM_DELTA_PAGE mode (wheel)', () =>
        new Promise((resolve) => {
          map.once('postrender', function () {
            const call = view.animateInternal.mock.calls[0];
            assert.strictEqual(call[0].resolution, 2);
            assert.deepEqual(call[0].anchor, map.getView().getCenter());
            resolve();
          });

          const event = new MapBrowserEvent('wheel', map, {
            type: 'wheel',
            deltaMode: WheelEvent.DOM_DELTA_PAGE,
            deltaY: 1,
            target: map.getViewport(),
            preventDefault: Event.prototype.preventDefault,
          });
          event.coordinate = map.getView().getCenter();
          event.pixel = map.getPixelFromCoordinate(event.coordinate);

          map.handleMapBrowserEvent(event);
        }));

      it('works on all browsers (wheel)', () =>
        new Promise((resolve) => {
          map.once('postrender', function () {
            const call = view.animateInternal.mock.calls[0];
            assert.strictEqual(call[0].resolution, 2);
            assert.deepEqual(call[0].anchor, map.getView().getCenter());
            resolve();
          });

          const event = new MapBrowserEvent('wheel', map, {
            type: 'wheel',
            deltaY: 300,
            target: map.getViewport(),
            preventDefault: Event.prototype.preventDefault,
          });
          event.coordinate = map.getView().getCenter();
          event.pixel = map.getPixelFromCoordinate(event.coordinate);

          map.handleMapBrowserEvent(event);
        }));
    });
  });
});
