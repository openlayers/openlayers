import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import EventTarget from '../../../../src/ol/events/Target.js';
import Interaction, {zoomByDelta} from '../../../../src/ol/interaction/Interaction.js';
import {FALSE} from '../../../../src/ol/functions.js';

describe('ol.interaction.Interaction', function() {

  describe('constructor', function() {
    let interaction;

    beforeEach(function() {
      interaction = new Interaction({});
    });

    it('creates a new interaction', function() {
      expect(interaction).to.be.a(Interaction);
      expect(interaction).to.be.a(EventTarget);
    });

    it('creates an active interaction', function() {
      expect(interaction.getActive()).to.be(true);
    });

  });

  describe('#getMap()', function() {

    it('retrieves the associated map', function() {
      const map = new Map({});
      const interaction = new Interaction({});
      interaction.setMap(map);
      expect(interaction.getMap()).to.be(map);
    });

    it('returns null if no map', function() {
      const interaction = new Interaction({});
      expect(interaction.getMap()).to.be(null);
    });

  });

  describe('#setMap()', function() {

    it('allows a map to be set', function() {
      const map = new Map({});
      const interaction = new Interaction({});
      interaction.setMap(map);
      expect(interaction.getMap()).to.be(map);
    });

    it('accepts null', function() {
      const interaction = new Interaction({});
      interaction.setMap(null);
      expect(interaction.getMap()).to.be(null);
    });

  });

  describe('#handleEvent()', function() {

    class MockInteraction extends Interaction {
      constructor() {
        super(...arguments);
      }
      handleEvent(mapBrowserEvent) {
        return false;
      }
    }

    it('has a default event handler', function() {
      const interaction = new Interaction({});
      expect(interaction.handleEvent()).to.be(true);
    });

    it('allows event handler overrides via options', function() {
      const interaction = new Interaction({
        handleEvent: FALSE
      });
      expect(interaction.handleEvent()).to.be(false);
    });

    it('allows event handler overrides via class extension', function() {
      const interaction = new MockInteraction({});
      expect(interaction.handleEvent()).to.be(false);
    });

  });

  describe('zoomByDelta()', function() {

    it('changes view resolution', function() {
      const view = new View({
        resolution: 1,
        resolutions: [4, 2, 1, 0.5, 0.25]
      });

      zoomByDelta(view, 1);
      expect(view.getResolution()).to.be(0.5);

      zoomByDelta(view, -1);
      expect(view.getResolution()).to.be(1);

      zoomByDelta(view, 2);
      expect(view.getResolution()).to.be(0.25);

      zoomByDelta(view, -2);
      expect(view.getResolution()).to.be(1);
    });

    it('changes view resolution and center relative to the anchor', function() {
      const view = new View({
        center: [0, 0],
        resolution: 1,
        resolutions: [4, 2, 1, 0.5, 0.25]
      });

      zoomByDelta(view, 1, [10, 10]);
      expect(view.getCenter()).to.eql([5, 5]);

      zoomByDelta(view, -1, [0, 0]);
      expect(view.getCenter()).to.eql([10, 10]);

      zoomByDelta(view, 2, [0, 0]);
      expect(view.getCenter()).to.eql([2.5, 2.5]);

      zoomByDelta(view, -2, [0, 0]);
      expect(view.getCenter()).to.eql([10, 10]);
    });

    it('changes view resolution and center relative to the anchor, while respecting the extent', function() {
      const view = new View({
        center: [0, 0],
        extent: [-2.5, -2.5, 2.5, 2.5],
        resolution: 1,
        resolutions: [4, 2, 1, 0.5, 0.25]
      });

      zoomByDelta(view, 1, [10, 10]);
      expect(view.getCenter()).to.eql([2.5, 2.5]);

      zoomByDelta(view, -1, [0, 0]);
      expect(view.getCenter()).to.eql([2.5, 2.5]);

      zoomByDelta(view, 2, [10, 10]);
      expect(view.getCenter()).to.eql([2.5, 2.5]);

      zoomByDelta(view, -2, [0, 0]);
      expect(view.getCenter()).to.eql([2.5, 2.5]);
    });
  });

});
