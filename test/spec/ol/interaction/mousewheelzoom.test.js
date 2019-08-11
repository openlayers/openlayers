import Map from '../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../src/ol/MapBrowserEvent.js';
import View from '../../../../src/ol/View.js';
import Event from '../../../../src/ol/events/Event.js';
import {DEVICE_PIXEL_RATIO, FIREFOX} from '../../../../src/ol/has.js';
import MouseWheelZoom, {Mode} from '../../../../src/ol/interaction/MouseWheelZoom.js';


describe('ol.interaction.MouseWheelZoom', function() {
  let map, interaction;

  beforeEach(function() {
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

  afterEach(function() {
    disposeMap(map);
    map = null;
    interaction = null;
  });

  describe('timeout duration', function() {
    let clock;
    beforeEach(function() {
      sinon.spy(interaction, 'handleWheelZoom_');
      clock = sinon.useFakeTimers();
    });

    afterEach(function() {
      clock.restore();
      interaction.handleWheelZoom_.restore();
    });

    it('works with the default value', function(done) {
      const event = new MapBrowserEvent('wheel', map, {
        type: 'wheel',
        target: map.getViewport(),
        preventDefault: Event.prototype.preventDefault
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

  describe('handleEvent()', function() {

    if (FIREFOX) {
      it('works on Firefox in DOM_DELTA_PIXEL mode (trackpad)', function(done) {
        map.once('postrender', function() {
          expect(interaction.mode_).to.be(Mode.TRACKPAD);
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
      it('works in DOM_DELTA_PIXEL mode (trackpad)', function(done) {
        map.once('postrender', function() {
          expect(interaction.mode_).to.be(Mode.TRACKPAD);
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

    describe('spying on view.animateInternal()', function() {
      let view;
      beforeEach(function() {
        view = map.getView();
        sinon.spy(view, 'animateInternal');
      });

      afterEach(function() {
        view.animateInternal.restore();
      });

      it('works in DOM_DELTA_LINE mode (wheel)', function(done) {
        map.once('postrender', function() {
          const call = view.animateInternal.getCall(0);
          expect(call.args[0].resolution).to.be(2);
          expect(call.args[0].anchor).to.eql([0, 0]);
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

      it('works on all browsers (wheel)', function(done) {
        map.once('postrender', function() {
          const call = view.animateInternal.getCall(0);
          expect(call.args[0].resolution).to.be(2);
          expect(call.args[0].anchor).to.eql([0, 0]);
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
