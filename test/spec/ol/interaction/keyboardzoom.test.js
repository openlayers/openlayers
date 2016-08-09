/*global createMapDiv, disposeMap*/
goog.provide('ol.test.interaction.KeyboardZoom');

goog.require('ol.Map');
goog.require('ol.MapBrowserEvent');
goog.require('ol.View');
goog.require('ol.events.Event');
goog.require('ol.interaction.Interaction');
describe('ol.interaction.KeyboardZoom', function() {
  var map;

  beforeEach(function() {
    map = new ol.Map({
      target: createMapDiv(100, 100),
      view: new ol.View({
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
      var spy = sinon.spy(ol.interaction.Interaction, 'zoomByDelta');
      var event = new ol.MapBrowserEvent('keydown', map, {
        type: 'keydown',
        target: map.getTargetElement(),
        preventDefault: ol.events.Event.prototype.preventDefault
      });
      event.originalEvent.charCode = '+'.charCodeAt(0);
      map.handleMapBrowserEvent(event);
      event.originalEvent.charCode = '-'.charCodeAt(0);
      map.handleMapBrowserEvent(event);
      expect(spy.getCall(0).args[2]).to.eql(1);
      expect(spy.getCall(1).args[2]).to.eql(-1);
      ol.interaction.Interaction.zoomByDelta.restore();
    });
  });

});
