import Collection from '../../../../src/ol/Collection.js';
import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import MapBrowserPointerEvent from '../../../../src/ol/MapBrowserPointerEvent.js';
import View from '../../../../src/ol/View.js';
import {doubleClick} from '../../../../src/ol/events/condition.js';
import Circle from '../../../../src/ol/geom/Circle.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import Modify, {ModifyEvent} from '../../../../src/ol/interaction/Modify.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Event from '../../../../src/ol/events/Event.js';
import {getValues} from '../../../../src/ol/obj.js';


describe('ol.interaction.Modify', () => {

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

    features = [
      new Feature({
        geometry: new Polygon([
          [[0, 0], [10, 20], [0, 40], [40, 40], [40, 0]]
        ])
      })
    ];

    source = new VectorSource({
      features: features
    });

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
   * @param {Object} modifiers Lookup of modifier keys.
   * @param {number} button The mouse button.
   */
  function simulateEvent(type, x, y, modifiers, button) {
    modifiers = modifiers || {};
    const viewport = map.getViewport();
    // calculated in case body has top < 0 (test runner with small window)
    const position = viewport.getBoundingClientRect();
    const pointerEvent = new Event();
    pointerEvent.type = type;
    pointerEvent.clientX = position.left + x + width / 2;
    pointerEvent.clientY = position.top + y + height / 2;
    pointerEvent.shiftKey = modifiers.shift || false;
    pointerEvent.altKey = modifiers.alt || false;
    pointerEvent.pointerId = 1;
    pointerEvent.preventDefault = function() {};
    pointerEvent.button = button;
    pointerEvent.isPrimary = true;
    const event = new MapBrowserPointerEvent(type, map, pointerEvent);
    map.handleMapBrowserEvent(event);
  }

  /**
   * Tracks events triggered by the interaction as well as feature
   * modifications. Helper function to
   * @param {ol.Feature} feature Modified feature.
   * @param {ol.interaction.Modify} interaction The interaction.
   * @return {Array<ModifyEvent|string>} events
   */
  function trackEvents(feature, interaction) {
    const events = [];
    feature.on('change', function(event) {
      events.push('change');
    });
    interaction.on('modifystart', function(event) {
      events.push(event);
    });
    interaction.on('modifyend', function(event) {
      events.push(event);
    });
    return events;
  }

  /**
  * Validates the event array to verify proper event sequence. Checks
  * that first and last event are correct ModifyEvents and that feature
  * modifications event are in between.
  * @param {Array<ModifyEvent|string>} events The events.
  * @param {Array<ol.Feature>} features The features.
  */
  function validateEvents(events, features) {

    const startevent = events[0];
    const endevent = events[events.length - 1];

    expect(startevent).toBeInstanceOf(ModifyEvent);
    expect(startevent.type).toEqual('modifystart');

    expect(endevent).toBeInstanceOf(ModifyEvent);
    expect(endevent.type).toEqual('modifyend');

    expect(events.length > 2).toBe(true);
    // middle events should be feature modification events
    for (let i = 1; i < events.length - 1; i++) {
      expect(events[i]).toBe('change');
    }

    expect(startevent.features.getArray()).toEqual(features);
    expect(endevent.features.getArray()).toEqual(features);
  }

  describe('constructor', () => {
    test('adds features to the RTree', () => {
      const feature = new Feature(
        new Point([0, 0]));
      const features = new Collection([feature]);
      const modify = new Modify({
        features: features
      });
      const rbushEntries = modify.rBush_.getAll();
      expect(rbushEntries.length).toBe(1);
      expect(rbushEntries[0].feature).toBe(feature);
    });

    test('accepts feature without geometry', () => {
      const feature = new Feature();
      const features = new Collection([feature]);
      const modify = new Modify({
        features: features
      });
      let rbushEntries = modify.rBush_.getAll();
      expect(rbushEntries.length).toBe(0);

      feature.setGeometry(new Point([0, 10]));
      rbushEntries = modify.rBush_.getAll();
      expect(rbushEntries.length).toBe(1);
      expect(rbushEntries[0].feature).toBe(feature);
    });

    test('accepts a source', () => {
      const feature = new Feature(
        new Point([0, 0]));
      const source = new VectorSource({features: [feature]});
      const modify = new Modify({source: source});
      const rbushEntries = modify.rBush_.getAll();
      expect(rbushEntries.length).toBe(1);
      expect(rbushEntries[0].feature).toBe(feature);
    });

  });

  describe('vertex deletion', () => {

    test('works when clicking on a shared vertex', () => {
      features.push(features[0].clone());

      const first = features[0];
      const firstRevision = first.getGeometry().getRevision();
      const second = features[1];
      const secondRevision = second.getGeometry().getRevision();

      const modify = new Modify({
        features: new Collection(features)
      });
      map.addInteraction(modify);

      const events = trackEvents(first, modify);

      expect(first.getGeometry().getRevision()).toBe(firstRevision);
      expect(first.getGeometry().getCoordinates()[0]).toHaveLength(5);
      expect(second.getGeometry().getRevision()).toBe(secondRevision);
      expect(second.getGeometry().getCoordinates()[0]).toHaveLength(5);

      simulateEvent('pointerdown', 10, -20, {alt: true}, 0);
      simulateEvent('pointerup', 10, -20, {alt: true}, 0);
      simulateEvent('click', 10, -20, {alt: true}, 0);
      simulateEvent('singleclick', 10, -20, {alt: true}, 0);

      expect(first.getGeometry().getRevision()).toBe(firstRevision + 1);
      expect(first.getGeometry().getCoordinates()[0]).toHaveLength(4);
      expect(second.getGeometry().getRevision()).toBe(secondRevision + 1);
      expect(second.getGeometry().getCoordinates()[0]).toHaveLength(4);

      validateEvents(events, features);
    });

    test('deletes first vertex of a LineString', () => {
      const lineFeature = new Feature({
        geometry: new LineString(
          [[0, 0], [10, 20], [0, 40], [40, 40], [40, 0]]
        )
      });
      features.length = 0;
      features.push(lineFeature);
      features.push(lineFeature.clone());

      const first = features[0];
      const firstRevision = first.getGeometry().getRevision();

      const modify = new Modify({
        features: new Collection(features)
      });
      map.addInteraction(modify);

      const events = trackEvents(first, modify);

      expect(first.getGeometry().getRevision()).toBe(firstRevision);
      expect(first.getGeometry().getCoordinates()).toHaveLength(5);

      simulateEvent('pointerdown', 0, 0, {alt: true}, 0);
      simulateEvent('pointerup', 0, 0, {alt: true}, 0);
      simulateEvent('click', 0, 0, {alt: true}, 0);
      simulateEvent('singleclick', 0, 0, {alt: true}, 0);

      expect(first.getGeometry().getRevision()).toBe(firstRevision + 1);
      expect(first.getGeometry().getCoordinates()).toHaveLength(4);
      expect(first.getGeometry().getCoordinates()[0][0]).toBe(10);
      expect(first.getGeometry().getCoordinates()[0][1]).toBe(20);

      validateEvents(events, features);
    });

    test('deletes last vertex of a LineString', () => {
      const lineFeature = new Feature({
        geometry: new LineString(
          [[0, 0], [10, 20], [0, 40], [40, 40], [40, 0]]
        )
      });
      features.length = 0;
      features.push(lineFeature);
      features.push(lineFeature.clone());

      const first = features[0];
      const firstRevision = first.getGeometry().getRevision();

      const modify = new Modify({
        features: new Collection(features)
      });
      map.addInteraction(modify);

      const events = trackEvents(first, modify);

      expect(first.getGeometry().getRevision()).toBe(firstRevision);
      expect(first.getGeometry().getCoordinates()).toHaveLength(5);

      simulateEvent('pointerdown', 40, 0, {alt: true}, 0);
      simulateEvent('pointerup', 40, 0, {alt: true}, 0);
      simulateEvent('click', 40, 0, {alt: true}, 0);
      simulateEvent('singleclick', 40, 0, {alt: true}, 0);

      expect(first.getGeometry().getRevision()).toBe(firstRevision + 1);
      expect(first.getGeometry().getCoordinates()).toHaveLength(4);
      expect(first.getGeometry().getCoordinates()[3][0]).toBe(40);
      expect(first.getGeometry().getCoordinates()[3][1]).toBe(40);

      validateEvents(events, features);
    });

    test('deletes vertex of a LineString programmatically', () => {
      const lineFeature = new Feature({
        geometry: new LineString(
          [[0, 0], [10, 20], [0, 40], [40, 40], [40, 0]]
        )
      });
      features.length = 0;
      features.push(lineFeature);
      features.push(lineFeature.clone());

      const first = features[0];
      const firstRevision = first.getGeometry().getRevision();

      const modify = new Modify({
        features: new Collection(features)
      });
      map.addInteraction(modify);

      const events = trackEvents(first, modify);

      expect(first.getGeometry().getRevision()).toBe(firstRevision);
      expect(first.getGeometry().getCoordinates()).toHaveLength(5);

      simulateEvent('pointerdown', 40, 0, null, 0);
      simulateEvent('pointerup', 40, 0, null, 0);

      const removed = modify.removePoint();

      expect(removed).toBe(true);
      expect(first.getGeometry().getRevision()).toBe(firstRevision + 1);
      expect(first.getGeometry().getCoordinates()).toHaveLength(4);
      expect(first.getGeometry().getCoordinates()[3][0]).toBe(40);
      expect(first.getGeometry().getCoordinates()[3][1]).toBe(40);

      validateEvents(events, features);
    });


  });

  describe('vertex modification', () => {

    test('keeps the third dimension', () => {
      const lineFeature = new Feature({
        geometry: new LineString(
          [[0, 0, 10], [10, 20, 20], [0, 40, 30], [40, 40, 40], [40, 0, 50]]
        )
      });
      features.length = 0;
      features.push(lineFeature);

      const modify = new Modify({
        features: new Collection(features)
      });
      map.addInteraction(modify);

      // Move first vertex
      simulateEvent('pointermove', 0, 0, null, 0);
      simulateEvent('pointerdown', 0, 0, null, 0);
      simulateEvent('pointermove', -10, -10, null, 0);
      simulateEvent('pointerdrag', -10, -10, null, 0);
      simulateEvent('pointerup', -10, -10, null, 0);

      // Move middle vertex
      simulateEvent('pointermove', 0, -40, null, 0);
      simulateEvent('pointerdown', 0, -40, null, 0);
      simulateEvent('pointermove', 10, -30, null, 0);
      simulateEvent('pointerdrag', 10, -30, null, 0);
      simulateEvent('pointerup', 10, -30, null, 0);

      // Move last vertex
      simulateEvent('pointermove', 40, 0, null, 0);
      simulateEvent('pointerdown', 40, 0, null, 0);
      simulateEvent('pointermove', 50, -10, null, 0);
      simulateEvent('pointerdrag', 50, -10, null, 0);
      simulateEvent('pointerup', 50, -10, null, 0);

      expect(lineFeature.getGeometry().getCoordinates()[0][2]).toBe(10);
      expect(lineFeature.getGeometry().getCoordinates()[2][2]).toBe(30);
      expect(lineFeature.getGeometry().getCoordinates()[4][2]).toBe(50);
    });

  });

  describe('circle modification', () => {
    test('changes the circle radius and center', () => {
      const circleFeature = new Feature(new Circle([10, 10], 20));
      features.length = 0;
      features.push(circleFeature);

      const modify = new Modify({
        features: new Collection(features)
      });
      map.addInteraction(modify);

      // Change center
      simulateEvent('pointermove', 10, -10, null, 0);
      simulateEvent('pointerdown', 10, -10, null, 0);
      simulateEvent('pointermove', 5, -5, null, 0);
      simulateEvent('pointerdrag', 5, -5, null, 0);
      simulateEvent('pointerup', 5, -5, null, 0);

      expect(circleFeature.getGeometry().getRadius()).toBe(20);
      expect(circleFeature.getGeometry().getCenter()).toEqual([5, 5]);

      // Increase radius
      simulateEvent('pointermove', 25, -4, null, 0);
      simulateEvent('pointerdown', 25, -4, null, 0);
      simulateEvent('pointermove', 30, -5, null, 0);
      simulateEvent('pointerdrag', 30, -5, null, 0);
      simulateEvent('pointerup', 30, -5, null, 0);

      expect(circleFeature.getGeometry().getRadius()).toBe(25);
      expect(circleFeature.getGeometry().getCenter()).toEqual([5, 5]);
    });
  });

  describe('boundary modification', () => {
    let modify, feature, events;

    beforeEach(() => {
      modify = new Modify({
        features: new Collection(features)
      });
      map.addInteraction(modify);

      feature = features[0];

      events = trackEvents(feature, modify);
    });

    test('clicking vertex should delete it and +r1', () => {
      expect(feature.getGeometry().getRevision()).toBe(1);
      expect(feature.getGeometry().getCoordinates()[0]).toHaveLength(5);

      simulateEvent('pointerdown', 10, -20, {alt: true}, 0);
      simulateEvent('pointerup', 10, -20, {alt: true}, 0);
      simulateEvent('click', 10, -20, {alt: true}, 0);
      simulateEvent('singleclick', 10, -20, {alt: true}, 0);

      expect(feature.getGeometry().getRevision()).toBe(2);
      expect(feature.getGeometry().getCoordinates()[0]).toHaveLength(4);

      validateEvents(events, [feature]);
    });

    test('single clicking boundary should add vertex and +r1', () => {
      expect(feature.getGeometry().getRevision()).toBe(1);
      expect(feature.getGeometry().getCoordinates()[0]).toHaveLength(5);

      simulateEvent('pointerdown', 40, -20, null, 0);
      simulateEvent('pointerup', 40, -20, null, 0);
      simulateEvent('click', 40, -20, null, 0);
      simulateEvent('singleclick', 40, -20, null, 0);

      expect(feature.getGeometry().getRevision()).toBe(2);
      expect(feature.getGeometry().getCoordinates()[0]).toHaveLength(6);

      validateEvents(events, [feature]);
    });

    test('single clicking on created vertex should delete it again', () => {
      expect(feature.getGeometry().getRevision()).toBe(1);
      expect(feature.getGeometry().getCoordinates()[0]).toHaveLength(5);

      simulateEvent('pointerdown', 40, -20, null, 0);
      simulateEvent('pointerup', 40, -20, null, 0);
      simulateEvent('click', 40, -20, null, 0);
      simulateEvent('singleclick', 40, -20, null, 0);

      expect(feature.getGeometry().getRevision()).toBe(2);
      expect(feature.getGeometry().getCoordinates()[0]).toHaveLength(6);

      validateEvents(events, [feature]);
      events.length = 0;

      simulateEvent('pointerdown', 40, -20, {alt: true}, 0);
      simulateEvent('pointerup', 40, -20, {alt: true}, 0);
      simulateEvent('click', 40, -20, {alt: true}, 0);
      simulateEvent('singleclick', 40, -20, {alt: true}, 0);

      expect(feature.getGeometry().getRevision()).toBe(3);
      expect(feature.getGeometry().getCoordinates()[0]).toHaveLength(5);

      validateEvents(events, [feature]);
    });

    test('clicking with drag should add vertex and +r3', () => {
      expect(feature.getGeometry().getRevision()).toBe(1);
      expect(feature.getGeometry().getCoordinates()[0]).toHaveLength(5);

      simulateEvent('pointermove', 40, -20, null, 0);
      simulateEvent('pointerdown', 40, -20, null, 0);
      simulateEvent('pointermove', 30, -20, null, 0);
      simulateEvent('pointerdrag', 30, -20, null, 0);
      simulateEvent('pointerup', 30, -20, null, 0);

      expect(feature.getGeometry().getRevision()).toBe(4);
      expect(feature.getGeometry().getCoordinates()[0]).toHaveLength(6);

      validateEvents(events, [feature]);
    });

    test('clicking with right button should not add a vertex', () => {
      expect(feature.getGeometry().getRevision()).toBe(1);
      expect(feature.getGeometry().getCoordinates()[0]).toHaveLength(5);

      simulateEvent('pointermove', 40, -20, null, 0);
      // right click
      simulateEvent('pointerdown', 40, -20, null, 1);
      simulateEvent('pointermove', 30, -20, null, 1);
      simulateEvent('pointerdrag', 30, -20, null, 1);
      simulateEvent('pointerup', 30, -20, null, 1);

      expect(feature.getGeometry().getRevision()).toBe(1);
      expect(feature.getGeometry().getCoordinates()[0]).toHaveLength(5);
      expect(events).toHaveLength(0);
    });

  });

  describe('double click deleteCondition', () => {

    let modify, feature, events;

    beforeEach(() => {
      modify = new Modify({
        features: new Collection(features),
        deleteCondition: doubleClick
      });
      map.addInteraction(modify);

      feature = features[0];

      events = trackEvents(feature, modify);
    });

    test('should delete vertex on double click', () => {

      expect(feature.getGeometry().getRevision()).toBe(1);
      expect(feature.getGeometry().getCoordinates()[0]).toHaveLength(5);

      simulateEvent('pointerdown', 10, -20, null, 0);
      simulateEvent('pointerup', 10, -20, null, 0);
      simulateEvent('click', 10, -20, null, 0);
      simulateEvent('pointerdown', 10, -20, null, 0);
      simulateEvent('pointerup', 10, -20, null, 0);
      simulateEvent('click', 10, -20, null, 0);
      simulateEvent('dblclick', 10, -20, null, 0);

      expect(feature.getGeometry().getRevision()).toBe(2);
      expect(feature.getGeometry().getCoordinates()[0]).toHaveLength(4);

      validateEvents(events, features);
    });

    test('should do nothing on single click', () => {

      expect(feature.getGeometry().getRevision()).toBe(1);
      expect(feature.getGeometry().getCoordinates()[0]).toHaveLength(5);

      simulateEvent('pointerdown', 10, -20, null, 0);
      simulateEvent('pointerup', 10, -20, null, 0);
      simulateEvent('click', 10, -20, null, 0);
      simulateEvent('singleclick', 10, -20, null, 0);

      expect(feature.getGeometry().getRevision()).toBe(1);
      expect(feature.getGeometry().getCoordinates()[0]).toHaveLength(5);

      expect(events.length).toEqual(0);
    });
  });

  describe('insertVertexCondition', () => {
    test('calls the callback function', () => {
      const listenerSpy = sinon.spy(function(event) {
        return false;
      });

      const modify = new Modify({
        features: new Collection(features),
        insertVertexCondition: listenerSpy
      });
      map.addInteraction(modify);
      const feature = features[0];

      // move first vertex
      simulateEvent('pointermove', 0, 0, null, 0);
      simulateEvent('pointerdown', 0, 0, null, 0);
      simulateEvent('pointermove', -10, -10, null, 0);
      simulateEvent('pointerdrag', -10, -10, null, 0);
      simulateEvent('pointerup', -10, -10, null, 0);

      expect(listenerSpy.callCount).toBe(0);
      expect(feature.getGeometry().getCoordinates()[0]).toHaveLength(5);

      // try to add vertex
      simulateEvent('pointerdown', 40, -20, null, 0);
      simulateEvent('pointerup', 40, -20, null, 0);
      simulateEvent('click', 40, -20, null, 0);
      simulateEvent('singleclick', 40, -20, null, 0);

      expect(listenerSpy.callCount).toBe(1);
      expect(feature.getGeometry().getCoordinates()[0]).toHaveLength(5);
    });
  });

  describe('handle feature change', () => {
    let getModifyListeners;

    beforeEach(() => {
      getModifyListeners = function(feature, modify) {
        const listeners = feature.listeners_['change'];
        const candidates = getValues(modify);
        return listeners.filter(function(listener) {
          return candidates.indexOf(listener) !== -1;
        });
      };
    });

    test('updates circle segment data', () => {
      const feature = new Feature(new Circle([10, 10], 20));
      features.length = 0;
      features.push(feature);

      const modify = new Modify({
        features: new Collection(features)
      });
      map.addInteraction(modify);

      let listeners;

      listeners = getModifyListeners(feature, modify);
      expect(listeners).toHaveLength(1);

      let firstSegmentData;

      firstSegmentData = modify.rBush_.forEachInExtent([0, 0, 5, 5],
        function(node) {
          return node;
        });
      expect(firstSegmentData.segment[0]).toEqual([10, 10]);
      expect(firstSegmentData.segment[1]).toEqual([10, 10]);

      const center = feature.getGeometry().getCenter();
      center[0] = 1;
      center[1] = 1;
      feature.getGeometry().setCenter(center);

      firstSegmentData = modify.rBush_.forEachInExtent([0, 0, 5, 5],
        function(node) {
          return node;
        });
      expect(firstSegmentData.segment[0]).toEqual([1, 1]);
      expect(firstSegmentData.segment[1]).toEqual([1, 1]);

      listeners = getModifyListeners(feature, modify);
      expect(listeners).toHaveLength(1);
    });

    test('updates polygon segment data', () => {
      const modify = new Modify({
        features: new Collection(features)
      });
      map.addInteraction(modify);

      const feature = features[0];
      let listeners;

      listeners = getModifyListeners(feature, modify);
      expect(listeners).toHaveLength(1);

      let firstSegmentData;

      firstSegmentData = modify.rBush_.forEachInExtent([0, 0, 5, 5],
        function(node) {
          return node;
        });
      expect(firstSegmentData.segment[0]).toEqual([0, 0]);
      expect(firstSegmentData.segment[1]).toEqual([10, 20]);

      const coordinates = feature.getGeometry().getCoordinates();
      const firstVertex = coordinates[0][0];
      firstVertex[0] = 1;
      firstVertex[1] = 1;
      feature.getGeometry().setCoordinates(coordinates);

      firstSegmentData = modify.rBush_.forEachInExtent([0, 0, 5, 5],
        function(node) {
          return node;
        });
      expect(firstSegmentData.segment[0]).toEqual([1, 1]);
      expect(firstSegmentData.segment[1]).toEqual([10, 20]);

      listeners = getModifyListeners(feature, modify);
      expect(listeners).toHaveLength(1);
    });
  });

  describe('handle feature removal during down-up sequence', () => {
    test(
      'removes segment data of removed features from dragSegments_',
      () => {
        const collection = new Collection(features);
        const modify = new Modify({
          features: collection
        });
        map.addInteraction(modify);
        simulateEvent('pointermove', 0, 0, null, 0);
        simulateEvent('pointerdown', 0, 0, null, 0);
        simulateEvent('pointermove', -10, -10, null, 0);
        simulateEvent('pointerdrag', -10, -10, null, 0);
        collection.remove(features[0]);
        expect(function() {
          simulateEvent('pointerup', -10, -10, null, 0);
        }).not.toThrow();
      }
    );
  });

  describe('#setActive', () => {
    test('removes the vertexFeature of deactivation', () => {
      const modify = new Modify({
        features: new Collection(features)
      });
      map.addInteraction(modify);
      expect(modify.vertexFeature_).toBe(null);

      simulateEvent('pointermove', 10, -20, null, 0);
      expect(modify.vertexFeature_).not.toBe(null);

      modify.setActive(false);
      expect(modify.vertexFeature_).toBe(null);
    });
  });

  describe('#getOverlay', () => {
    test('returns the feature overlay layer', () => {
      const modify = new Modify({
        features: new Collection()
      });
      expect (modify.getOverlay()).toEqual(modify.overlay_);
    });
  });

});
