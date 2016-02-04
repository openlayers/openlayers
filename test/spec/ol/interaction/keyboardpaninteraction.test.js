/*global createMapDiv, disposeMap*/
goog.provide('ol.test.interaction.KeyboardPan');


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
      var event = new ol.MapBrowserEvent(ol.events.EventType.KEYDOWN, map, {
        type: ol.events.EventType.KEYDOWN,
        target: map.getTargetElement(),
        preventDefault: ol.events.Event.prototype.preventDefault
      });
      event.originalEvent.keyCode = ol.events.KeyCode.DOWN;
      map.handleMapBrowserEvent(event);
      event.originalEvent.keyCode = ol.events.KeyCode.UP;
      map.handleMapBrowserEvent(event);
      event.originalEvent.keyCode = ol.events.KeyCode.LEFT;
      map.handleMapBrowserEvent(event);
      event.originalEvent.keyCode = ol.events.KeyCode.RIGHT;
      map.handleMapBrowserEvent(event);
      expect(spy.getCall(0).args[2]).to.eql([0, -128]);
      expect(spy.getCall(1).args[2]).to.eql([0, 128]);
      expect(spy.getCall(2).args[2]).to.eql([-128, 0]);
      expect(spy.getCall(3).args[2]).to.eql([128, 0]);
      ol.interaction.Interaction.pan.restore();
    });
  });

});


goog.require('ol.Map');
goog.require('ol.MapBrowserEvent');
goog.require('ol.View');
goog.require('ol.events.Event');
goog.require('ol.events.EventType');
goog.require('ol.events.KeyCode');
goog.require('ol.interaction.Interaction');
goog.require('ol.interaction.KeyboardPan');
