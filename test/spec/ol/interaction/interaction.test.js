

import _ol_Map_ from '../../../../src/ol/map';
import _ol_View_ from '../../../../src/ol/view';
import _ol_events_EventTarget_ from '../../../../src/ol/events/eventtarget';
import _ol_interaction_Interaction_ from '../../../../src/ol/interaction/interaction';

describe('ol.interaction.Interaction', function() {

  describe('constructor', function() {
    var interaction;

    beforeEach(function() {
      interaction = new _ol_interaction_Interaction_({});
    });

    it('creates a new interaction', function() {
      expect(interaction).to.be.a(_ol_interaction_Interaction_);
      expect(interaction).to.be.a(_ol_events_EventTarget_);
    });

    it('creates an active interaction', function() {
      expect(interaction.getActive()).to.be(true);
    });

  });

  describe('#getMap()', function() {

    it('retrieves the associated map', function() {
      var map = new _ol_Map_({});
      var interaction = new _ol_interaction_Interaction_({});
      interaction.setMap(map);
      expect(interaction.getMap()).to.be(map);
    });

    it('returns null if no map', function() {
      var interaction = new _ol_interaction_Interaction_({});
      expect(interaction.getMap()).to.be(null);
    });

  });

  describe('#setMap()', function() {

    it('allows a map to be set', function() {
      var map = new _ol_Map_({});
      var interaction = new _ol_interaction_Interaction_({});
      interaction.setMap(map);
      expect(interaction.getMap()).to.be(map);
    });

    it('accepts null', function() {
      var interaction = new _ol_interaction_Interaction_({});
      interaction.setMap(null);
      expect(interaction.getMap()).to.be(null);
    });

  });

  describe('zoomByDelta()', function() {

    it('changes view resolution', function() {
      var view = new _ol_View_({
        resolution: 1,
        resolutions: [4, 2, 1, 0.5, 0.25]
      });

      _ol_interaction_Interaction_.zoomByDelta(view, 1);
      expect(view.getResolution()).to.be(0.5);

      _ol_interaction_Interaction_.zoomByDelta(view, -1);
      expect(view.getResolution()).to.be(1);

      _ol_interaction_Interaction_.zoomByDelta(view, 2);
      expect(view.getResolution()).to.be(0.25);

      _ol_interaction_Interaction_.zoomByDelta(view, -2);
      expect(view.getResolution()).to.be(1);
    });

    it('changes view resolution and center relative to the anchor', function() {
      var view = new _ol_View_({
        center: [0, 0],
        resolution: 1,
        resolutions: [4, 2, 1, 0.5, 0.25]
      });

      _ol_interaction_Interaction_.zoomByDelta(view, 1, [10, 10]);
      expect(view.getCenter()).to.eql([5, 5]);

      _ol_interaction_Interaction_.zoomByDelta(view, -1, [0, 0]);
      expect(view.getCenter()).to.eql([10, 10]);

      _ol_interaction_Interaction_.zoomByDelta(view, 2, [0, 0]);
      expect(view.getCenter()).to.eql([2.5, 2.5]);

      _ol_interaction_Interaction_.zoomByDelta(view, -2, [0, 0]);
      expect(view.getCenter()).to.eql([10, 10]);
    });

    it('changes view resolution and center relative to the anchor, while respecting the extent', function() {
      var view = new _ol_View_({
        center: [0, 0],
        extent: [-2.5, -2.5, 2.5, 2.5],
        resolution: 1,
        resolutions: [4, 2, 1, 0.5, 0.25]
      });

      _ol_interaction_Interaction_.zoomByDelta(view, 1, [10, 10]);
      expect(view.getCenter()).to.eql([2.5, 2.5]);

      _ol_interaction_Interaction_.zoomByDelta(view, -1, [0, 0]);
      expect(view.getCenter()).to.eql([2.5, 2.5]);

      _ol_interaction_Interaction_.zoomByDelta(view, 2, [10, 10]);
      expect(view.getCenter()).to.eql([2.5, 2.5]);

      _ol_interaction_Interaction_.zoomByDelta(view, -2, [0, 0]);
      expect(view.getCenter()).to.eql([2.5, 2.5]);
    });
  });

});
