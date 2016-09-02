/*global createMapDiv, disposeMap*/
goog.provide('ol.test.interaction.MouseWheelZoom');

goog.require('ol.Map');
goog.require('ol.MapBrowserEvent');
goog.require('ol.View');
goog.require('ol.events.Event');
goog.require('ol.has');
goog.require('ol.interaction.Interaction');


describe('ol.interaction.MouseWheelZoom', function() {
  var map;

  beforeEach(function() {
    map = new ol.Map({
      target: createMapDiv(100, 100),
      view: new ol.View({
        center: [0, 0],
        resolutions: [2, 1, 0.5],
        zoom: 1
      })
    });
    map.renderSync();
  });
  afterEach(function() {
    disposeMap(map);
  });

  describe('handleEvent()', function() {
    it('[wheel] works on Firefox in DOM_DELTA_PIXEL mode', function(done) {
      var origHasFirefox = ol.has.FIREFOX;
      ol.has.FIREFOX = true;
      var spy = sinon.spy(ol.interaction.Interaction, 'zoomByDelta');
      map.once('postrender', function() {
        expect(spy.getCall(0).args[2]).to.be(-1);
        expect(spy.getCall(0).args[3]).to.eql([0, 0]);
        ol.interaction.Interaction.zoomByDelta.restore();
        ol.has.FIREFOX = origHasFirefox;
        done();
      });
      var event = new ol.MapBrowserEvent('wheel', map, {
        type: 'wheel',
        deltaMode: WheelEvent.DOM_DELTA_PIXEL,
        deltaY: ol.has.DEVICE_PIXEL_RATIO,
        target: map.getViewport(),
        preventDefault: ol.events.Event.prototype.preventDefault
      });
      event.coordinate = [0, 0];
      map.handleMapBrowserEvent(event);
    });
    it('[wheel] works in DOM_DELTA_PIXEL mode', function(done) {
      var origHasFirefox = ol.has.FIREFOX;
      ol.has.FIREFOX = false;
      var spy = sinon.spy(ol.interaction.Interaction, 'zoomByDelta');
      map.once('postrender', function() {
        expect(spy.getCall(0).args[2]).to.be(-1);
        expect(spy.getCall(0).args[3]).to.eql([0, 0]);
        ol.interaction.Interaction.zoomByDelta.restore();
        ol.has.FIREFOX = origHasFirefox;
        done();
      });
      var event = new ol.MapBrowserEvent('wheel', map, {
        type: 'wheel',
        deltaMode: WheelEvent.DOM_DELTA_PIXEL,
        deltaY: 1,
        target: map.getViewport(),
        preventDefault: ol.events.Event.prototype.preventDefault
      });
      event.coordinate = [0, 0];
      map.handleMapBrowserEvent(event);
    });
    it('[wheel] works in DOM_DELTA_LINE mode', function(done) {
      var spy = sinon.spy(ol.interaction.Interaction, 'zoomByDelta');
      map.once('postrender', function() {
        expect(spy.getCall(0).args[2]).to.be(-1);
        expect(spy.getCall(0).args[3]).to.eql([0, 0]);
        ol.interaction.Interaction.zoomByDelta.restore();
        done();
      });
      var event = new ol.MapBrowserEvent('wheel', map, {
        type: 'wheel',
        deltaMode: WheelEvent.DOM_DELTA_LINE,
        deltaY: 1 / 40,
        target: map.getViewport(),
        preventDefault: ol.events.Event.prototype.preventDefault
      });
      event.coordinate = [0, 0];
      map.handleMapBrowserEvent(event);
    });
    it('[mousewheel] works on Safari', function(done) {
      var origHasSafari = ol.has.SAFARI;
      ol.has.SAFARI = true;
      var spy = sinon.spy(ol.interaction.Interaction, 'zoomByDelta');
      map.once('postrender', function() {
        expect(spy.getCall(0).args[2]).to.be(-1);
        expect(spy.getCall(0).args[3]).to.eql([0, 0]);
        ol.interaction.Interaction.zoomByDelta.restore();
        ol.has.SAFARI = origHasSafari;
        done();
      });
      var event = new ol.MapBrowserEvent('mousewheel', map, {
        type: 'mousewheel',
        wheelDeltaY: -3,
        target: map.getViewport(),
        preventDefault: ol.events.Event.prototype.preventDefault
      });
      event.coordinate = [0, 0];
      map.handleMapBrowserEvent(event);
    });
    it('[mousewheel] works on other browsers', function(done) {
      var origHasSafari = ol.has.SAFARI;
      ol.has.SAFARI = false;
      var spy = sinon.spy(ol.interaction.Interaction, 'zoomByDelta');
      map.once('postrender', function() {
        expect(spy.getCall(0).args[2]).to.be(-1);
        expect(spy.getCall(0).args[3]).to.eql([0, 0]);
        ol.interaction.Interaction.zoomByDelta.restore();
        ol.has.SAFARI = origHasSafari;
        done();
      });
      var event = new ol.MapBrowserEvent('mousewheel', map, {
        type: 'mousewheel',
        wheelDeltaY: -1,
        target: map.getViewport(),
        preventDefault: ol.events.Event.prototype.preventDefault
      });
      event.coordinate = [0, 0];
      map.handleMapBrowserEvent(event);
    });
  });

});
