import {spy as sinonSpy, useFakeTimers} from 'sinon';
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
    let clock;
    beforeEach(function () {
      sinonSpy(interaction, 'handleWheelZoom_');
      clock = useFakeTimers();
    });

    afterEach(function () {
      clock.restore();
      interaction.handleWheelZoom_.restore();
    });

    it('works with the default value', function (done) {
      const event = new MapBrowserEvent('wheel', map, {
        type: 'wheel',
        target: map.getViewport(),
        preventDefault: Event.prototype.preventDefault,
      });

      map.handleMapBrowserEvent(event);
      clock.tick(50);
      // default timeout is 80 ms, not called yet
      expect(interaction.handleWheelZoom_.called).to.be(false);

      clock.tick(30);
      expect(interaction.handleWheelZoom_.called).to.be(true);

      done();
    });
  });

  describe('handleEvent()', function () {
    it('works in DOM_DELTA_PIXEL mode (trackpad)', function (done) {
      map.once('postrender', function () {
        expect(interaction.mode_).to.be('trackpad');
        done();
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
    });

    describe('spying on view.animateInternal()', function () {
      let view;
      beforeEach(function () {
        view = map.getView();
        sinonSpy(view, 'animateInternal');
      });

      afterEach(function () {
        view.animateInternal.restore();
      });

      it('works in DOM_DELTA_LINE mode (wheel)', function (done) {
        map.once('postrender', function () {
          const call = view.animateInternal.getCall(0);
          expect(call.args[0].resolution).to.be(2);
          expect(call.args[0].anchor).to.eql(map.getView().getCenter());
          done();
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
      });

      it('works in DOM_DELTA_PAGE mode (wheel)', function (done) {
        map.once('postrender', function () {
          const call = view.animateInternal.getCall(0);
          expect(call.args[0].resolution).to.be(2);
          expect(call.args[0].anchor).to.eql(map.getView().getCenter());
          done();
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
      });

      it('works on all browsers (wheel)', function (done) {
        map.once('postrender', function () {
          const call = view.animateInternal.getCall(0);
          expect(call.args[0].resolution).to.be(2);
          expect(call.args[0].anchor).to.eql(map.getView().getCenter());
          done();
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
      });
    });
  });
});
