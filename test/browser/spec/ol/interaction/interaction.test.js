import {assert} from 'chai';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import EventTarget from '../../../../../src/ol/events/Target.js';
import {FALSE} from '../../../../../src/ol/functions.js';
import Interaction, {
  zoomByDelta,
} from '../../../../../src/ol/interaction/Interaction.js';
import {
  clearUserProjection,
  useGeographic,
} from '../../../../../src/ol/proj.js';

describe('ol.interaction.Interaction', function () {
  describe('constructor', function () {
    let interaction;

    beforeEach(function () {
      interaction = new Interaction({});
    });

    it('creates a new interaction', function () {
      assert.instanceOf(interaction, Interaction);
      assert.instanceOf(interaction, EventTarget);
    });

    it('creates an active interaction', function () {
      assert.strictEqual(interaction.getActive(), true);
    });
  });

  describe('#getMap()', function () {
    it('retrieves the associated map', function () {
      const map = new Map({});
      const interaction = new Interaction({});
      interaction.setMap(map);
      assert.strictEqual(interaction.getMap(), map);
    });

    it('returns null if no map', function () {
      const interaction = new Interaction({});
      assert.strictEqual(interaction.getMap(), null);
    });
  });

  describe('#setMap()', function () {
    it('allows a map to be set', function () {
      const map = new Map({});
      const interaction = new Interaction({});
      interaction.setMap(map);
      assert.strictEqual(interaction.getMap(), map);
    });

    it('accepts null', function () {
      const interaction = new Interaction({});
      interaction.setMap(null);
      assert.strictEqual(interaction.getMap(), null);
    });
  });

  describe('#handleEvent()', function () {
    class MockInteraction extends Interaction {
      constructor() {
        super(...arguments);
      }
      handleEvent(mapBrowserEvent) {
        return false;
      }
    }

    it('has a default event handler', function () {
      const interaction = new Interaction({});
      assert.strictEqual(interaction.handleEvent(), true);
    });

    it('allows event handler overrides via options', function () {
      const interaction = new Interaction({
        handleEvent: FALSE,
      });
      assert.strictEqual(interaction.handleEvent(), false);
    });

    it('allows event handler overrides via class extension', function () {
      const interaction = new MockInteraction({});
      assert.strictEqual(interaction.handleEvent(), false);
    });
  });
});

describe('zoomByDelta - useGeographic', () => {
  beforeEach(useGeographic);
  afterEach(clearUserProjection);

  it('works with a user projection set', () => {
    const view = new View({
      center: [0, 0],
      zoom: 0,
    });

    const spy = vi.spyOn(view, 'animate');

    const anchor = [90, 45];
    const duration = 10;
    zoomByDelta(view, 1, anchor, duration);

    assert.strictEqual(spy.mock.calls.length, 1);
    const options = spy.mock.calls[0][0];
    assert.strictEqual(options.anchor, anchor);
  });
});
