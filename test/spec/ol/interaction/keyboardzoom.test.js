import Map from '../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../src/ol/MapBrowserEvent.js';
import View from '../../../../src/ol/View.js';
import Event from '../../../../src/ol/events/Event.js';

describe('ol.interaction.KeyboardZoom', () => {
  let map;

  beforeEach(() => {
    map = new Map({
      target: createMapDiv(100, 100),
      view: new View({
        center: [0, 0],
        resolutions: [4, 2, 1],
        zoom: 1
      })
    });
    map.renderSync();
  });
  afterEach(() => {
    disposeMap(map);
  });

  describe('handleEvent()', () => {
    test('zooms on + and - keys', () => {
      const view = map.getView();
      const spy = sinon.spy(view, 'animateInternal');
      const event = new MapBrowserEvent('keydown', map, {
        type: 'keydown',
        target: map.getTargetElement(),
        preventDefault: Event.prototype.preventDefault
      });

      event.originalEvent.charCode = '+'.charCodeAt(0);
      map.handleMapBrowserEvent(event);
      expect(spy.getCall(0).args[0].resolution).toEqual(1);
      view.setResolution(2);

      event.originalEvent.charCode = '-'.charCodeAt(0);
      map.handleMapBrowserEvent(event);
      expect(spy.getCall(1).args[0].resolution).toEqual(4);
      view.setResolution(2);

      view.animateInternal.restore();
    });
  });

});
