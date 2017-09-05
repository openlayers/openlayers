

import _ol_Map_ from '../../../../src/ol/map';
import _ol_MapBrowserEvent_ from '../../../../src/ol/mapbrowserevent';
import _ol_View_ from '../../../../src/ol/view';
import _ol_events_Event_ from '../../../../src/ol/events/event';
import _ol_has_ from '../../../../src/ol/has';
import _ol_interaction_Interaction_ from '../../../../src/ol/interaction/interaction';
import _ol_interaction_MouseWheelZoom_ from '../../../../src/ol/interaction/mousewheelzoom';


describe('ol.interaction.MouseWheelZoom', function() {
  var map, interaction;

  beforeEach(function() {
    interaction = new _ol_interaction_MouseWheelZoom_();
    map = new _ol_Map_({
      target: createMapDiv(100, 100),
      interactions: [interaction],
      view: new _ol_View_({
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
    var clock;
    beforeEach(function() {
      sinon.spy(_ol_interaction_Interaction_, 'zoomByDelta');
      clock = sinon.useFakeTimers();
    });

    afterEach(function() {
      clock.restore();
      _ol_interaction_Interaction_.zoomByDelta.restore();
    });

    it('works with the defaut value', function(done) {
      var event = new _ol_MapBrowserEvent_('mousewheel', map, {
        type: 'mousewheel',
        target: map.getViewport(),
        preventDefault: _ol_events_Event_.prototype.preventDefault
      });
      map.handleMapBrowserEvent(event);
      clock.tick(50);
      // default timeout is 80 ms, not called yet
      expect(_ol_interaction_Interaction_.zoomByDelta.called).to.be(false);
      clock.tick(30);
      expect(_ol_interaction_Interaction_.zoomByDelta.called).to.be(true);

      done();
    });

  });

  describe('handleEvent()', function() {

    it('works on Firefox in DOM_DELTA_PIXEL mode (trackpad)', function(done) {
      var origHasFirefox = _ol_has_.FIREFOX;
      _ol_has_.FIREFOX = true;
      map.once('postrender', function() {
        expect(interaction.mode_).to.be(_ol_interaction_MouseWheelZoom_.Mode_.TRACKPAD);
        _ol_has_.FIREFOX = origHasFirefox;
        done();
      });
      var event = new _ol_MapBrowserEvent_('wheel', map, {
        type: 'wheel',
        deltaMode: WheelEvent.DOM_DELTA_PIXEL,
        deltaY: _ol_has_.DEVICE_PIXEL_RATIO,
        target: map.getViewport(),
        preventDefault: _ol_events_Event_.prototype.preventDefault
      });
      event.coordinate = [0, 0];
      map.handleMapBrowserEvent(event);
    });

    it('works in DOM_DELTA_PIXEL mode (trackpad)', function(done) {
      var origHasFirefox = _ol_has_.FIREFOX;
      _ol_has_.FIREFOX = false;
      map.once('postrender', function() {
        expect(interaction.mode_).to.be(_ol_interaction_MouseWheelZoom_.Mode_.TRACKPAD);
        _ol_has_.FIREFOX = origHasFirefox;
        done();
      });
      var event = new _ol_MapBrowserEvent_('wheel', map, {
        type: 'wheel',
        deltaMode: WheelEvent.DOM_DELTA_PIXEL,
        deltaY: 1,
        target: map.getViewport(),
        preventDefault: _ol_events_Event_.prototype.preventDefault
      });
      event.coordinate = [0, 0];
      map.handleMapBrowserEvent(event);
    });

    describe('spying on ol.interaction.Interaction.zoomByDelta', function() {
      beforeEach(function() {
        sinon.spy(_ol_interaction_Interaction_, 'zoomByDelta');
      });
      afterEach(function() {
        _ol_interaction_Interaction_.zoomByDelta.restore();
      });

      it('works in DOM_DELTA_LINE mode (wheel)', function(done) {
        map.once('postrender', function() {
          var call = _ol_interaction_Interaction_.zoomByDelta.getCall(0);
          expect(call.args[1]).to.be(-1);
          expect(call.args[2]).to.eql([0, 0]);
          done();
        });
        var event = new _ol_MapBrowserEvent_('wheel', map, {
          type: 'wheel',
          deltaMode: WheelEvent.DOM_DELTA_LINE,
          deltaY: 3.714599609375,
          target: map.getViewport(),
          preventDefault: _ol_events_Event_.prototype.preventDefault
        });
        event.coordinate = [0, 0];
        map.handleMapBrowserEvent(event);
      });

      it('works on Safari (wheel)', function(done) {
        var origHasSafari = _ol_has_.SAFARI;
        _ol_has_.SAFARI = true;
        map.once('postrender', function() {
          var call = _ol_interaction_Interaction_.zoomByDelta.getCall(0);
          expect(call.args[1]).to.be(-1);
          expect(call.args[2]).to.eql([0, 0]);
          _ol_has_.SAFARI = origHasSafari;
          done();
        });
        var event = new _ol_MapBrowserEvent_('mousewheel', map, {
          type: 'mousewheel',
          wheelDeltaY: -50,
          target: map.getViewport(),
          preventDefault: _ol_events_Event_.prototype.preventDefault
        });
        event.coordinate = [0, 0];
        map.handleMapBrowserEvent(event);
      });

      it('works on other browsers (wheel)', function(done) {
        var origHasSafari = _ol_has_.SAFARI;
        _ol_has_.SAFARI = false;
        map.once('postrender', function() {
          var call = _ol_interaction_Interaction_.zoomByDelta.getCall(0);
          expect(call.args[1]).to.be(-1);
          expect(call.args[2]).to.eql([0, 0]);
          _ol_has_.SAFARI = origHasSafari;
          done();
        });
        var event = new _ol_MapBrowserEvent_('mousewheel', map, {
          type: 'mousewheel',
          wheelDeltaY: -120,
          target: map.getViewport(),
          preventDefault: _ol_events_Event_.prototype.preventDefault
        });
        event.coordinate = [0, 0];
        map.handleMapBrowserEvent(event);
      });

    });

  });

});
