import Map from '../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../src/ol/MapBrowserEvent.js';
import View from '../../../../src/ol/View.js';
import Event from '../../../../src/ol/events/Event.js';
import {DEVICE_PIXEL_RATIO, FIREFOX} from '../../../../src/ol/has.js';
import MouseWheelZoom, {Mode} from '../../../../src/ol/interaction/MouseWheelZoom.js';


describe('ol.interaction.MouseWheelZoom', () => {
  let map, interaction;

  beforeEach(() => {
    interaction = new MouseWheelZoom();
    map = new Map({
      target: createMapDiv(100, 100),
      interactions: [interaction],
      view: new View({
        center: [0, 0],
        resolutions: [2, 1, 0.5],
        zoom: 1
      })
    });
    map.renderSync();
  });

  afterEach(() => {
    disposeMap(map);
    map = null;
    interaction = null;
  });

  describe('timeout duration', () => {
    let clock;
    beforeEach(() => {
      sinon.spy(interaction, 'handleWheelZoom_');
      clock = sinon.useFakeTimers();
    });

    afterEach(() => {
      clock.restore();
      interaction.handleWheelZoom_.restore();
    });

    test('works with the default value', done => {
      const event = new MapBrowserEvent('wheel', map, {
        type: 'wheel',
        target: map.getViewport(),
        preventDefault: Event.prototype.preventDefault
      });

      map.handleMapBrowserEvent(event);
      clock.tick(50);
      expect(interaction.handleWheelZoom_.called).toBe(false);

      clock.tick(30);
      expect(interaction.handleWheelZoom_.called).toBe(true);

      done();
    });

  });

  describe('handleEvent()', () => {

    if (FIREFOX) {
      test('works on Firefox in DOM_DELTA_PIXEL mode (trackpad)', done => {
        map.once('postrender', function() {
          expect(interaction.mode_).toBe(Mode.TRACKPAD);
          done();
        });
        const event = new MapBrowserEvent('wheel', map, {
          type: 'wheel',
          deltaMode: WheelEvent.DOM_DELTA_PIXEL,
          deltaY: DEVICE_PIXEL_RATIO,
          target: map.getViewport(),
          preventDefault: Event.prototype.preventDefault
        });
        event.coordinate = [0, 0];
        map.handleMapBrowserEvent(event);
      });
    }

    if (!FIREFOX) {
      test('works in DOM_DELTA_PIXEL mode (trackpad)', done => {
        map.once('postrender', function() {
          expect(interaction.mode_).toBe(Mode.TRACKPAD);
          done();
        });
        const event = new MapBrowserEvent('wheel', map, {
          type: 'wheel',
          deltaMode: WheelEvent.DOM_DELTA_PIXEL,
          deltaY: 1,
          target: map.getViewport(),
          preventDefault: Event.prototype.preventDefault
        });
        event.coordinate = [0, 0];
        map.handleMapBrowserEvent(event);
      });
    }

    describe('spying on view.animateInternal()', () => {
      let view;
      beforeEach(() => {
        view = map.getView();
        sinon.spy(view, 'animateInternal');
      });

      afterEach(() => {
        view.animateInternal.restore();
      });

      test('works in DOM_DELTA_LINE mode (wheel)', done => {
        map.once('postrender', function() {
          const call = view.animateInternal.getCall(0);
          expect(call.args[0].resolution).toBe(2);
          expect(call.args[0].anchor).toEqual([0, 0]);
          done();
        });

        const event = new MapBrowserEvent('wheel', map, {
          type: 'wheel',
          deltaMode: WheelEvent.DOM_DELTA_LINE,
          deltaY: 3.714599609375,
          target: map.getViewport(),
          preventDefault: Event.prototype.preventDefault
        });
        event.coordinate = [0, 0];

        map.handleMapBrowserEvent(event);
      });

      test('works on all browsers (wheel)', done => {
        map.once('postrender', function() {
          const call = view.animateInternal.getCall(0);
          expect(call.args[0].resolution).toBe(2);
          expect(call.args[0].anchor).toEqual([0, 0]);
          done();
        });

        const event = new MapBrowserEvent('wheel', map, {
          type: 'wheel',
          deltaY: 120,
          target: map.getViewport(),
          preventDefault: Event.prototype.preventDefault
        });
        event.coordinate = [0, 0];

        map.handleMapBrowserEvent(event);
      });

    });

  });

});
