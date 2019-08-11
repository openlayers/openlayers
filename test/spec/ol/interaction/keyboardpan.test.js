import Map from '../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../src/ol/MapBrowserEvent.js';
import View from '../../../../src/ol/View.js';
import Event from '../../../../src/ol/events/Event.js';

describe('ol.interaction.KeyboardPan', function() {
  let map;

  beforeEach(function() {
    map = new Map({
      target: createMapDiv(100, 100),
      view: new View({
        center: [0, 0],
        resolutions: [1],
        zoom: 0
      })
    });
    map.renderSync();
  });
  afterEach(function() {
    disposeMap(map);
  });

  describe('handleEvent()', function() {
    it('pans on arrow keys', function() {
      const view = map.getView();
      const spy = sinon.spy(view, 'animateInternal');
      const event = new MapBrowserEvent('keydown', map, {
        type: 'keydown',
        target: map.getTargetElement(),
        preventDefault: Event.prototype.preventDefault
      });

      event.originalEvent.keyCode = 40; // DOWN
      map.handleMapBrowserEvent(event);
      expect(spy.getCall(0).args[0].center).to.eql([0, -128]);
      view.setCenter([0, 0]);

      event.originalEvent.keyCode = 38; // UP
      map.handleMapBrowserEvent(event);
      expect(spy.getCall(1).args[0].center).to.eql([0, 128]);
      view.setCenter([0, 0]);

      event.originalEvent.keyCode = 37; // LEFT
      map.handleMapBrowserEvent(event);
      expect(spy.getCall(2).args[0].center).to.eql([-128, 0]);
      view.setCenter([0, 0]);

      event.originalEvent.keyCode = 39; // RIGHT
      map.handleMapBrowserEvent(event);
      expect(spy.getCall(3).args[0].center).to.eql([128, 0]);
      view.setCenter([0, 0]);

      view.animateInternal.restore();
    });
  });

});
