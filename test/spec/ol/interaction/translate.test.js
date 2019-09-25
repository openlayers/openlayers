import Collection from '../../../../src/ol/Collection.js';
import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import MapBrowserPointerEvent from '../../../../src/ol/MapBrowserPointerEvent.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import Translate, {TranslateEvent} from '../../../../src/ol/interaction/Translate.js';
import Interaction from '../../../../src/ol/interaction/Interaction.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';


describe('ol.interaction.Translate', () => {
  let target, map, source, features;

  const width = 360;
  const height = 180;

  beforeEach(done => {
    target = document.createElement('div');
    const style = target.style;
    style.position = 'absolute';
    style.left = '-1000px';
    style.top = '-1000px';
    style.width = width + 'px';
    style.height = height + 'px';
    document.body.appendChild(target);
    source = new VectorSource();
    features = [new Feature({
      geometry: new Point([10, -20])
    }), new Feature({
      geometry: new Point([20, -30])
    })];
    source.addFeatures(features);
    const layer = new VectorLayer({source: source});
    map = new Map({
      target: target,
      layers: [layer],
      view: new View({
        projection: 'EPSG:4326',
        center: [0, 0],
        resolution: 1
      })
    });
    map.once('postrender', function() {
      done();
    });
  });

  afterEach(() => {
    map.dispose();
    document.body.removeChild(target);
  });

  /**
   * Simulates a browser event on the map viewport.  The client x/y location
   * will be adjusted as if the map were centered at 0,0.
   * @param {string} type Event type.
   * @param {number} x Horizontal offset from map center.
   * @param {number} y Vertical offset from map center.
   * @param {boolean=} opt_shiftKey Shift key is pressed.
   */
  function simulateEvent(type, x, y, opt_shiftKey) {
    const viewport = map.getViewport();
    // calculated in case body has top < 0 (test runner with small window)
    const position = viewport.getBoundingClientRect();
    const shiftKey = opt_shiftKey !== undefined ? opt_shiftKey : false;
    const event = new MapBrowserPointerEvent(type, map,
      new PointerEvent(type, {
        clientX: position.left + x + width / 2,
        clientY: position.top + y + height / 2,
        shiftKey: shiftKey,
        preventDefault: function() {}
      }));
    map.handleMapBrowserEvent(event);
  }

  /**
   * Tracks events triggered by the interaction as well as feature
   * modifications. Helper function to
   * @param {ol.Feature} feature Translated feature.
   * @param {ol.interaction.Translate} interaction The interaction.
   * @return {Array<TranslateEvent|string>} events
   */
  function trackEvents(feature, interaction) {
    const events = [];
    feature.on('change', function(event) {
      events.push('change');
    });
    interaction.on('translatestart', function(event) {
      events.push(event);
    });
    interaction.on('translateend', function(event) {
      events.push(event);
    });
    return events;
  }

  /**
   * Validates the event array to verify proper event sequence. Checks
   * that first and last event are correct TranslateEvents and that feature
   * modifications event are in between.
   * @param {Array<TranslateEvent|string>} events The events.
   * @param {Array<ol.Feature>} features The features.
   */
  function validateEvents(events, features) {

    const startevent = events[0];
    const endevent = events[events.length - 1];

    expect(startevent).toBeInstanceOf(TranslateEvent);
    expect(startevent.type).toEqual('translatestart');

    expect(endevent).toBeInstanceOf(TranslateEvent);
    expect(endevent.type).toEqual('translateend');

    expect(events.length > 2).toBe(true);
    // middle events should be feature modification events
    for (let i = 1; i < events.length - 1; i++) {
      expect(events[i]).toBe('change');
    }

    expect(startevent.features.getArray()).toEqual(features);
    expect(endevent.features.getArray()).toEqual(features);
  }


  describe('constructor', () => {

    test('creates a new interaction', () => {
      const translate = new Translate({
        features: features
      });
      expect(translate).toBeInstanceOf(Translate);
      expect(translate).toBeInstanceOf(Interaction);
    });

  });

  describe('setActive', () => {

    test('works when the map is not set', () => {
      const translate = new Translate({
        features: features
      });
      expect(translate.getActive()).toBe(true);
      translate.setActive(false);
      expect(translate.getActive()).toBe(false);
    });

  });

  describe('moving features, with features option', () => {
    let translate;

    beforeEach(() => {
      translate = new Translate({
        features: new Collection([features[0]])
      });
      map.addInteraction(translate);
    });

    test('moves a selected feature', () => {
      const events = trackEvents(features[0], translate);

      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerdrag', 50, -40);
      simulateEvent('pointerup', 50, -40);
      const geometry = features[0].getGeometry();
      expect(geometry).toBeInstanceOf(Point);
      expect(geometry.getCoordinates()).toEqual([50, 40]);

      validateEvents(events, [features[0]]);
    });

    test('does not move an unselected feature', () => {
      const events = trackEvents(features[0], translate);

      simulateEvent('pointermove', 20, 30);
      simulateEvent('pointerdown', 20, 30);
      simulateEvent('pointerdrag', 50, -40);
      simulateEvent('pointerup', 50, -40);
      const geometry = features[1].getGeometry();
      expect(geometry).toBeInstanceOf(Point);
      expect(geometry.getCoordinates()).toEqual([20, -30]);

      expect(events).toHaveLength(0);
    });
  });

  describe('moving features, without features option', () => {
    let translate;

    beforeEach(() => {
      translate = new Translate();
      map.addInteraction(translate);
    });

    test('moves only targeted feature', () => {
      const events = trackEvents(features[0], translate);

      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerdrag', 50, -40);
      simulateEvent('pointerup', 50, -40);
      expect(features[0].getGeometry().getCoordinates()).toEqual([50, 40]);
      expect(features[1].getGeometry().getCoordinates()).toEqual([20, -30]);

      validateEvents(events, [features[0]]);
    });
  });

  describe('moving features, with filter option', () => {
    let translate;

    beforeEach(() => {
      translate = new Translate({
        filter: function(feature, layer) {
          return feature == features[0];
        }
      });
      map.addInteraction(translate);
    });

    test('moves a filter-passing feature', () => {
      const events = trackEvents(features[0], translate);

      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerdrag', 50, -40);
      simulateEvent('pointerup', 50, -40);
      const geometry = features[0].getGeometry();
      expect(geometry).toBeInstanceOf(Point);
      expect(geometry.getCoordinates()).toEqual([50, 40]);

      validateEvents(events, [features[0]]);
    });

    test('does not move a filter-discarded feature', () => {
      const events = trackEvents(features[0], translate);

      simulateEvent('pointermove', 20, 30);
      simulateEvent('pointerdown', 20, 30);
      simulateEvent('pointerdrag', 50, -40);
      simulateEvent('pointerup', 50, -40);
      const geometry = features[1].getGeometry();
      expect(geometry).toBeInstanceOf(Point);
      expect(geometry.getCoordinates()).toEqual([20, -30]);

      expect(events).toHaveLength(0);
    });
  });

  describe('changes css cursor', () => {
    let element, translate;

    beforeEach(() => {
      translate = new Translate();
      map.addInteraction(translate);
      element = map.getViewport();
    });

    test('changes css cursor', () => {
      expect(element.classList.contains('ol-grabbing')).toBe(false);
      expect(element.classList.contains('ol-grab')).toBe(false);

      simulateEvent('pointermove', 10, 20);
      expect(element.classList.contains('ol-grabbing')).toBe(false);
      expect(element.classList.contains('ol-grab')).toBe(true);

      simulateEvent('pointerdown', 10, 20);
      expect(element.classList.contains('ol-grabbing')).toBe(true);
      expect(element.classList.contains('ol-grab')).toBe(false);

      simulateEvent('pointerup', 10, 20);
      expect(element.classList.contains('ol-grabbing')).toBe(false);
      expect(element.classList.contains('ol-grab')).toBe(true);

      simulateEvent('pointermove', 0, 0);
      expect(element.classList.contains('ol-grabbing')).toBe(false);
      expect(element.classList.contains('ol-grab')).toBe(false);
    });

    test(
      'resets css cursor when interaction is deactivated while pointer is on feature',
      () => {
        simulateEvent('pointermove', 10, 20);
        expect(element.classList.contains('ol-grabbing')).toBe(false);
        expect(element.classList.contains('ol-grab')).toBe(true);

        translate.setActive(false);

        simulateEvent('pointermove', 0, 0);
        expect(element.classList.contains('ol-grabbing')).toBe(false);
        expect(element.classList.contains('ol-grab')).toBe(false);
      }
    );

    test(
      'resets css cursor interaction is removed while pointer is on feature',
      () => {
        simulateEvent('pointermove', 10, 20);
        expect(element.classList.contains('ol-grabbing')).toBe(false);
        expect(element.classList.contains('ol-grab')).toBe(true);

        map.removeInteraction(translate);

        simulateEvent('pointermove', 0, 0);
        expect(element.classList.contains('ol-grabbing')).toBe(false);
        expect(element.classList.contains('ol-grab')).toBe(false);
      }
    );

    test(
      'resets css cursor to existing cursor interaction is removed while pointer is on feature',
      () => {
        element.style.cursor = 'pointer';

        simulateEvent('pointermove', 10, 20);
        expect(element.classList.contains('ol-grabbing')).toBe(false);
        expect(element.classList.contains('ol-grab')).toBe(true);

        map.removeInteraction(translate);

        simulateEvent('pointermove', 0, 0);
        expect(element.classList.contains('ol-grabbing')).toBe(false);
        expect(element.classList.contains('ol-grab')).toBe(false);
      }
    );

  });

});
