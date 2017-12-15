import _ol_Map_ from '../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../src/ol/MapBrowserEvent.js';
import _ol_View_ from '../../../../src/ol/View.js';
import Event from '../../../../src/ol/events/Event.js';
import _ol_interaction_Interaction_ from '../../../../src/ol/interaction/Interaction.js';
describe('ol.interaction.KeyboardZoom', function() {
  var map;

  beforeEach(function() {
    map = new _ol_Map_({
      target: createMapDiv(100, 100),
      view: new _ol_View_({
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
      var spy = sinon.spy(_ol_interaction_Interaction_, 'zoomByDelta');
      var event = new MapBrowserEvent('keydown', map, {
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
      _ol_interaction_Interaction_.zoomByDelta.restore();
    });
  });

});
