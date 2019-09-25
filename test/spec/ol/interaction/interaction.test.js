import Map from '../../../../src/ol/Map.js';
import EventTarget from '../../../../src/ol/events/Target.js';
import Interaction from '../../../../src/ol/interaction/Interaction.js';
import {FALSE} from '../../../../src/ol/functions.js';

describe('ol.interaction.Interaction', () => {

  describe('constructor', () => {
    let interaction;

    beforeEach(() => {
      interaction = new Interaction({});
    });

    test('creates a new interaction', () => {
      expect(interaction).toBeInstanceOf(Interaction);
      expect(interaction).toBeInstanceOf(EventTarget);
    });

    test('creates an active interaction', () => {
      expect(interaction.getActive()).toBe(true);
    });

  });

  describe('#getMap()', () => {

    test('retrieves the associated map', () => {
      const map = new Map({});
      const interaction = new Interaction({});
      interaction.setMap(map);
      expect(interaction.getMap()).toBe(map);
    });

    test('returns null if no map', () => {
      const interaction = new Interaction({});
      expect(interaction.getMap()).toBe(null);
    });

  });

  describe('#setMap()', () => {

    test('allows a map to be set', () => {
      const map = new Map({});
      const interaction = new Interaction({});
      interaction.setMap(map);
      expect(interaction.getMap()).toBe(map);
    });

    test('accepts null', () => {
      const interaction = new Interaction({});
      interaction.setMap(null);
      expect(interaction.getMap()).toBe(null);
    });

  });

  describe('#handleEvent()', () => {

    class MockInteraction extends Interaction {
      constructor() {
        super(...arguments);
      }
      handleEvent(mapBrowserEvent) {
        return false;
      }
    }

    test('has a default event handler', () => {
      const interaction = new Interaction({});
      expect(interaction.handleEvent()).toBe(true);
    });

    test('allows event handler overrides via options', () => {
      const interaction = new Interaction({
        handleEvent: FALSE
      });
      expect(interaction.handleEvent()).toBe(false);
    });

    test('allows event handler overrides via class extension', () => {
      const interaction = new MockInteraction({});
      expect(interaction.handleEvent()).toBe(false);
    });

  });

});
