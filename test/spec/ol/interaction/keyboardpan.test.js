/*global createMapDiv, disposeMap*/
goog.provide('ol.test.interaction.KeyboardPan');

goog.require('ol.Map');
goog.require('ol.MapBrowserEvent');
goog.require('ol.View');
goog.require('ol.events.Event');
goog.require('ol.interaction.Interaction');
describe('ol.interaction.KeyboardPan', function() {
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
    it('pans on arrow keys', function() {
      var spy = sinon.spy(ol.interaction.Interaction, 'pan');
      var event = new ol.MapBrowserEvent('keydown', map, {
        type: 'keydown',
        target: map.getTargetElement(),
        preventDefault: ol.events.Event.prototype.preventDefault
      });
      event.originalEvent.keyCode = 40; // DOWN
      map.handleMapBrowserEvent(event);
      event.originalEvent.keyCode = 38; // UP
      map.handleMapBrowserEvent(event);
      event.originalEvent.keyCode = 37; // LEFT
      map.handleMapBrowserEvent(event);
      event.originalEvent.keyCode = 39; // RIGHT
      map.handleMapBrowserEvent(event);
      expect(spy.getCall(0).args[2]).to.eql([0, -128]);
      expect(spy.getCall(1).args[2]).to.eql([0, 128]);
      expect(spy.getCall(2).args[2]).to.eql([-128, 0]);
      expect(spy.getCall(3).args[2]).to.eql([128, 0]);
      ol.interaction.Interaction.pan.restore();
    });
  });

});
