import Map from '../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../src/ol/MapBrowserEvent.js';
import View from '../../../../src/ol/View.js';
import Event from '../../../../src/ol/events/Event.js';
import {DEVICE_PIXEL_RATIO, FIREFOX} from '../../../../src/ol/has.js';
import MouseWheelZoom from '../../../../src/ol/interaction/MouseWheelZoom.js';


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
      sinon.spy(interaction, 'endInteraction_');
      clock = sinon.useFakeTimers();
    });

    afterEach(function() {
      clock.restore();
      interaction.endInteraction_.restore();
    });

    it('works with the default value', function(done) {
      const event = new MapBrowserEvent('wheel', map, {
        type: 'wheel',
        target: map.getViewport(),
        preventDefault: Event.prototype.preventDefault
      });

      map.handleMapBrowserEvent(event);
      clock.tick(100);
      // default timeout is 400 ms, not called yet
      expect(interaction.endInteraction_.called).to.be(false);

      clock.tick(300);
      expect(interaction.endInteraction_.called).to.be(true);

      done();
    });

  });

  describe('handleEvent()', function() {

    let view;
    beforeEach(function() {
      view = map.getView();
    });

    if (FIREFOX) {
      it('works on Firefox in DOM_DELTA_PIXEL mode (trackpad)', function(done) {
        map.once('postrender', function() {
          expect(interaction.lastDelta_).to.be(1);
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
          expect(interaction.lastDelta_).to.be(1);
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


    it('works in DOM_DELTA_LINE mode (wheel)', function(done) {
      map.once('postrender', function() {
        expect(view.getResolution()).to.be(2);
        expect(view.getCenter()).to.eql([0, 0]);
        done();
      });

      const event = new MapBrowserEvent('wheel', map, {
        type: 'wheel',
        deltaMode: WheelEvent.DOM_DELTA_LINE,
        deltaY: 7.5,
        target: map.getViewport(),
        preventDefault: Event.prototype.preventDefault
      });
      event.coordinate = [0, 0];

      map.handleMapBrowserEvent(event);
    });

    it('works on all browsers (wheel)', function(done) {
      map.once('postrender', function() {
        expect(view.getResolution()).to.be(2);
        expect(view.getCenter()).to.eql([0, 0]);
        done();
      });

      const event = new MapBrowserEvent('wheel', map, {
        type: 'wheel',
        deltaY: 300, // trackpadDeltaPerZoom_
        target: map.getViewport(),
        preventDefault: Event.prototype.preventDefault
      });
      event.coordinate = [0, 0];

      map.handleMapBrowserEvent(event);
    });

    it('works in DOM_DELTA_LINE mode (wheel)', function(done) {
      map.once('postrender', function() {
        expect(view.getResolution()).to.be(2);
        expect(view.getCenter()).to.eql([0, 0]);
        done();
      });

      const event = new MapBrowserEvent('wheel', map, {
        type: 'wheel',
        deltaMode: WheelEvent.DOM_DELTA_LINE,
        deltaY: 7.5, // trackpadDeltaPerZoom_ / 40
        target: map.getViewport(),
        preventDefault: Event.prototype.preventDefault
      });
      event.coordinate = [0, 0];

      map.handleMapBrowserEvent(event);
    });

  });

});
