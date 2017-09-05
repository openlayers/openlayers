

import _ol_Map_ from '../../../../src/ol/map';
import _ol_MapBrowserEvent_ from '../../../../src/ol/mapbrowserevent';
import _ol_View_ from '../../../../src/ol/view';
import _ol_events_Event_ from '../../../../src/ol/events/event';
import _ol_interaction_Interaction_ from '../../../../src/ol/interaction/interaction';
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
      var event = new _ol_MapBrowserEvent_('keydown', map, {
        type: 'keydown',
        target: map.getTargetElement(),
        preventDefault: _ol_events_Event_.prototype.preventDefault
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
