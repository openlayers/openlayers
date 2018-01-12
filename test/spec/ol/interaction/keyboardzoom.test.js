import Map from '../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../src/ol/MapBrowserEvent.js';
import View from '../../../../src/ol/View.js';
import Event from '../../../../src/ol/events/Event.js';
import Interaction from '../../../../src/ol/interaction/Interaction.js';

describe('ol.interaction.KeyboardZoom', function() {
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
    it('zooms on + and - keys', function() {
      const spy = sinon.spy(Interaction, 'zoomByDelta');
      const event = new MapBrowserEvent('keydown', map, {
        type: 'keydown',
        target: map.getTargetElement(),
        preventDefault: Event.prototype.preventDefault
      });
      event.originalEvent.charCode = '+'.charCodeAt(0);
      map.handleMapBrowserEvent(event);
      event.originalEvent.charCode = '-'.charCodeAt(0);
      map.handleMapBrowserEvent(event);
      expect(spy.getCall(0).args[1]).to.eql(1);
      expect(spy.getCall(1).args[1]).to.eql(-1);
      Interaction.zoomByDelta.restore();
    });
  });

});
