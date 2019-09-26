import {Map, View} from '../../../../src/ol/index.js';
import EventTarget from '../../../../src/ol/events/Target.js';
import Interaction, {zoomByDelta} from '../../../../src/ol/interaction/Interaction.js';
import {FALSE} from '../../../../src/ol/functions.js';
import {useGeographic, clearUserProjection} from '../../../../src/ol/proj.js';

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

});

describe('zoomByDelta - useGeographic', () => {
  beforeEach(useGeographic);
  afterEach(clearUserProjection);

  it('works with a user projection set', done => {
    const view = new View({
      center: [0, 0],
      zoom: 0
    });

    const anchor = [90, 45];
    zoomByDelta(view, 1, anchor, 10);
    view.on('change:resolution', function() {
      setTimeout(function() {
        if (!view.getAnimating()) {
          const center = view.getCenter();
          expect(center[0]).to.be(45);
          expect(center[1]).to.roughlyEqual(24.4698, 1e-4);
          done();
        }
      }, 16);
    });
  });
});
