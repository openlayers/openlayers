import {assert} from 'chai';
import {spy as sinonSpy} from 'sinon';
import Collection from '../../../../../src/ol/Collection.js';
import CollectionEventType from '../../../../../src/ol/CollectionEventType.js';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../../src/ol/MapBrowserEvent.js';
import ObjectEventType from '../../../../../src/ol/ObjectEventType.js';
import View from '../../../../../src/ol/View.js';
import EventType from '../../../../../src/ol/events/EventType.js';
import {
  click,
  doubleClick,
  never,
} from '../../../../../src/ol/events/condition.js';
import Circle from '../../../../../src/ol/geom/Circle.js';
import GeometryCollection from '../../../../../src/ol/geom/GeometryCollection.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import MultiPoint from '../../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon, {fromExtent} from '../../../../../src/ol/geom/Polygon.js';
import Modify, {ModifyEvent} from '../../../../../src/ol/interaction/Modify.js';
import Snap from '../../../../../src/ol/interaction/Snap.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import {
  clearUserProjection,
  setUserProjection,
  useGeographic,
} from '../../../../../src/ol/proj.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import VectorEventType from '../../../../../src/ol/source/VectorEventType.js';
import CircleStyle from '../../../../../src/ol/style/Circle.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import Style from '../../../../../src/ol/style/Style.js';

describe('ol.interaction.Modify', function () {
  let target, map, layer, source, features;

  const width = 360;
  const height = 180;

  beforeEach(function (done) {
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
          [
            [0, 0],
            [10, 20],
            [0, 40],
            [40, 40],
            [40, 0],
          ],
        ]),
      }),
    ];

    source = new VectorSource({
      features: features,
    });

    layer = new VectorLayer({source: source});

    map = new Map({
      target: target,
      layers: [layer],
      view: new View({
        projection: 'EPSG:4326',
        center: [0, 0],
        resolution: 1,
      }),
    });

    map.once('postrender', function () {
      done();
    });
  });

  afterEach(function () {
    disposeMap(map);
    clearUserProjection();
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
    const pointerEvent = new PointerEvent(type, {
      clientX: position.left + x + width / 2,
      clientY: position.top + y + height / 2,
      shiftKey: modifiers.shift || false,
      altKey: modifiers.alt || false,
      button: button,
      pointerId: 1,
      isPrimary: true,
    });
    Object.defineProperty(pointerEvent, 'target', {
      writable: false,
      value: viewport.firstChild,
    });
    const event = new MapBrowserEvent(type, map, pointerEvent);
    map.handleMapBrowserEvent(event);
  }

  /**
   * Tracks events triggered by the interaction as well as feature
   * modifications. Helper function to
   * @param {Feature} feature Modified feature.
   * @param {Modify} interaction The interaction.
   * @return {Array<ModifyEvent|string>} events
   */
  function trackEvents(feature, interaction) {
    const events = [];
    feature.on('change', function (event) {
      events.push('change');
    });
    interaction.on('modifystart', function (event) {
      events.push(event);
    });
    interaction.on('modifyend', function (event) {
      events.push(event);
    });
    return events;
  }

  /**
   * Validates the event array to verify proper event sequence. Checks
   * that first and last event are correct ModifyEvents and that feature
   * modifications event are in between.
   * @param {Array<ModifyEvent|string>} events The events.
   * @param {Array<Feature>} features The features.
   */
  function validateEvents(events, features) {
    const startevent = events[0];
    const endevent = events[events.length - 1];

    assert.instanceOf(startevent, ModifyEvent);
    assert.deepEqual(startevent.type, 'modifystart');

    assert.instanceOf(endevent, ModifyEvent);
    assert.deepEqual(endevent.type, 'modifyend');

    assert.strictEqual(events.length > 2, true);
    // middle events should be feature modification events
    for (let i = 1; i < events.length - 1; i++) {
      assert.equal(events[i], 'change');
    }

    assert.deepEqual(startevent.features.getArray(), features);
    assert.deepEqual(endevent.features.getArray(), features);
  }

  describe('constructor', function () {
    it('adds features to the RTree', function () {
      const feature = new Feature(new Point([0, 0]));
      const features = new Collection([feature]);
      const modify = new Modify({
        features: features,
      });
      const rbushEntries = modify.rBush_.getAll();
      assert.strictEqual(rbushEntries.length, 1);
      assert.strictEqual(rbushEntries[0].feature, feature);
    });

    it('accepts feature without geometry', function () {
      const feature = new Feature();
      const features = new Collection([feature]);
      const modify = new Modify({
        features: features,
      });
      let rbushEntries = modify.rBush_.getAll();
      assert.strictEqual(rbushEntries.length, 0);

      feature.setGeometry(new Point([0, 10]));
      rbushEntries = modify.rBush_.getAll();
      assert.strictEqual(rbushEntries.length, 1);
      assert.strictEqual(rbushEntries[0].feature, feature);
    });

    it('accepts a source', function () {
      const feature = new Feature(new Point([0, 0]));
      const source = new VectorSource({features: [feature]});
      const modify = new Modify({source: source});
      const rbushEntries = modify.rBush_.getAll();
      assert.strictEqual(rbushEntries.length, 1);
      assert.strictEqual(rbushEntries[0].feature, feature);
    });

    it('accepts a hitDetection option', function () {
      const feature = new Feature(new Point([0, 0]));
      const source = new VectorSource({features: [feature]});
      const layer = new VectorLayer({source: source});
      const modify = new Modify({hitDetection: layer, source: source});
      const rbushEntries = modify.rBush_.getAll();
      assert.strictEqual(rbushEntries.length, 1);
      assert.strictEqual(rbushEntries[0].feature, feature);
      assert.strictEqual(modify.hitDetection_, layer);
    });

    it('accepts a snapToPointer option', function () {
      const modify = new Modify({source: source, snapToPointer: true});
      assert.strictEqual(modify.snapToPointer_, true);
    });
  });

  describe('vertex deletion', function () {
    it('works when clicking on a shared vertex', function () {
      features.push(features[0].clone());

      const first = features[0];
      const firstRevision = first.getGeometry().getRevision();
      const second = features[1];
      const secondRevision = second.getGeometry().getRevision();

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      const events = trackEvents(first, modify);

      assert.equal(first.getGeometry().getRevision(), firstRevision);
      assert.lengthOf(first.getGeometry().getCoordinates()[0], 5);
      assert.equal(second.getGeometry().getRevision(), secondRevision);
      assert.lengthOf(second.getGeometry().getCoordinates()[0], 5);

      simulateEvent('pointerdown', 10, -20, {alt: true}, 0);
      simulateEvent('pointerup', 10, -20, {alt: true}, 0);
      simulateEvent('click', 10, -20, {alt: true}, 0);
      simulateEvent('singleclick', 10, -20, {alt: true}, 0);

      assert.equal(first.getGeometry().getRevision(), firstRevision + 1);
      assert.lengthOf(first.getGeometry().getCoordinates()[0], 4);
      assert.equal(second.getGeometry().getRevision(), secondRevision + 1);
      assert.lengthOf(second.getGeometry().getCoordinates()[0], 4);

      validateEvents(events, features);
    });

    it('deletes first vertex of a LineString', function () {
      const lineFeature = new Feature({
        geometry: new LineString([
          [0, 0],
          [10, 20],
          [0, 40],
          [40, 40],
          [40, 0],
        ]),
      });
      features.length = 0;
      features.push(lineFeature);
      features.push(lineFeature.clone());

      const first = features[0];
      const firstRevision = first.getGeometry().getRevision();

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      const events = trackEvents(first, modify);

      assert.equal(first.getGeometry().getRevision(), firstRevision);
      assert.lengthOf(first.getGeometry().getCoordinates(), 5);

      simulateEvent('pointerdown', 0, 0, {alt: true}, 0);
      simulateEvent('pointerup', 0, 0, {alt: true}, 0);
      simulateEvent('click', 0, 0, {alt: true}, 0);
      simulateEvent('singleclick', 0, 0, {alt: true}, 0);

      assert.equal(first.getGeometry().getRevision(), firstRevision + 1);
      assert.lengthOf(first.getGeometry().getCoordinates(), 4);
      assert.equal(first.getGeometry().getCoordinates()[0][0], 10);
      assert.equal(first.getGeometry().getCoordinates()[0][1], 20);

      validateEvents(events, features);
    });

    it('deletes last vertex of a LineString', function () {
      const lineFeature = new Feature({
        geometry: new LineString([
          [0, 0],
          [10, 20],
          [0, 40],
          [40, 40],
          [40, 0],
        ]),
      });
      features.length = 0;
      features.push(lineFeature);
      features.push(lineFeature.clone());

      const first = features[0];
      const firstRevision = first.getGeometry().getRevision();

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      const events = trackEvents(first, modify);

      assert.equal(first.getGeometry().getRevision(), firstRevision);
      assert.lengthOf(first.getGeometry().getCoordinates(), 5);

      simulateEvent('pointerdown', 40, 0, {alt: true}, 0);
      simulateEvent('pointerup', 40, 0, {alt: true}, 0);
      simulateEvent('click', 40, 0, {alt: true}, 0);
      simulateEvent('singleclick', 40, 0, {alt: true}, 0);

      assert.equal(first.getGeometry().getRevision(), firstRevision + 1);
      assert.lengthOf(first.getGeometry().getCoordinates(), 4);
      assert.equal(first.getGeometry().getCoordinates()[3][0], 40);
      assert.equal(first.getGeometry().getCoordinates()[3][1], 40);

      validateEvents(events, features);
    });

    it('deletes vertex of a LineString programmatically', function () {
      const lineFeature = new Feature({
        geometry: new LineString([
          [0, 0],
          [10, 20],
          [0, 40],
          [40, 40],
          [40, 0],
        ]),
      });
      features.length = 0;
      features.push(lineFeature);
      features.push(lineFeature.clone());

      const first = features[0];
      const firstRevision = first.getGeometry().getRevision();

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      const events = trackEvents(first, modify);

      assert.equal(first.getGeometry().getRevision(), firstRevision);
      assert.lengthOf(first.getGeometry().getCoordinates(), 5);

      simulateEvent('pointerdown', 40, 0, null, 0);
      simulateEvent('pointerup', 40, 0, null, 0);

      const removed = modify.removePoint();

      assert.strictEqual(removed, true);
      assert.equal(first.getGeometry().getRevision(), firstRevision + 1);
      assert.lengthOf(first.getGeometry().getCoordinates(), 4);
      assert.equal(first.getGeometry().getCoordinates()[3][0], 40);
      assert.equal(first.getGeometry().getCoordinates()[3][1], 40);

      validateEvents(events, features);
    });

    it('deletes user provided vertex of a LineString programmatically', function () {
      const lineFeature = new Feature({
        geometry: new LineString([
          [0, 0],
          [10, 20],
          [0, 40],
          [40, 40],
          [40, 0],
        ]),
      });
      features.length = 0;
      features.push(lineFeature);
      features.push(lineFeature.clone());

      const first = features[0];
      const firstRevision = first.getGeometry().getRevision();

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      const events = trackEvents(first, modify);

      assert.equal(first.getGeometry().getRevision(), firstRevision);
      assert.lengthOf(first.getGeometry().getCoordinates(), 5);

      const removed = modify.removePoint([40, 0]);

      assert.strictEqual(removed, true);
      assert.equal(first.getGeometry().getRevision(), firstRevision + 1);
      assert.lengthOf(first.getGeometry().getCoordinates(), 4);
      assert.equal(first.getGeometry().getCoordinates()[3][0], 40);
      assert.equal(first.getGeometry().getCoordinates()[3][1], 40);

      validateEvents(events, features);
    });

    it('canRemovePoint() returns true when point can be deleted', function () {
      const lineFeature = new Feature({
        geometry: new LineString([
          [0, 0],
          [10, 20],
          [0, 40],
          [40, 40],
          [40, 0],
        ]),
      });
      features.length = 0;
      features.push(lineFeature);

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      simulateEvent('pointermove', 10, -20, null, 0);

      assert.strictEqual(modify.canRemovePoint(), true);
    });

    it('canRemovePoint() returns false when point cannot be deleted', function () {
      const lineFeature = new Feature({
        geometry: new LineString([
          [0, 0],
          [10, 20],
          [0, 40],
        ]),
      });
      features.length = 0;
      features.push(lineFeature);

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      simulateEvent('pointermove', 5, -10, null, 0);

      assert.strictEqual(modify.canRemovePoint(), false);
    });
  });

  describe('vertex modification', function () {
    it('keeps the third dimension', function () {
      const lineFeature = new Feature({
        geometry: new LineString([
          [0, 0, 10],
          [10, 20, 20],
          [0, 40, 30],
          [40, 40, 40],
          [40, 0, 50],
        ]),
      });
      features.length = 0;
      features.push(lineFeature);

      const modify = new Modify({
        features: new Collection(features),
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

      assert.equal(lineFeature.getGeometry().getCoordinates()[0][2], 10);
      assert.equal(lineFeature.getGeometry().getCoordinates()[2][2], 30);
      assert.equal(lineFeature.getGeometry().getCoordinates()[4][2], 50);
    });

    it('preserves different Z values across geometries at shared vertex with sharedVerticesEqual', function () {
      const lineZ1 = new Feature({
        geometry: new LineString([
          [0, 0, 100],
          [10, 20, 200],
        ]),
      });
      const lineZ2 = new Feature({
        geometry: new LineString([
          [0, 0, 999],
          [10, 20, 888],
        ]),
      });
      features.length = 0;
      features.push(lineZ1, lineZ2);

      const modify = new Modify({
        features: new Collection(features),
        sharedVerticesEqual: function (a, b) {
          return a[0] === b[0] && a[1] === b[1];
        },
      });
      map.addInteraction(modify);

      // Drag the first shared vertex from [0, 0] to [-10, -10]
      simulateEvent('pointermove', 0, 0, null, 0);
      simulateEvent('pointerdown', 0, 0, null, 0);
      simulateEvent('pointermove', -10, 10, null, 0);
      simulateEvent('pointerdrag', -10, 10, null, 0);
      simulateEvent('pointerup', -10, 10, null, 0);

      let coordsZ1 = lineZ1.getGeometry().getCoordinates();
      let coordsZ2 = lineZ2.getGeometry().getCoordinates();

      assert.deepEqual(coordsZ1[0], [-10, -10, 100]);
      assert.deepEqual(coordsZ1[1], [10, 20, 200]);

      assert.deepEqual(coordsZ2[0], [-10, -10, 999]);
      assert.deepEqual(coordsZ2[1], [10, 20, 888]);

      // Second drag: move the second shared vertex from [10, 20] to [15, 25]
      simulateEvent('pointermove', 10, -20, null, 0);
      simulateEvent('pointerdown', 10, -20, null, 0);
      simulateEvent('pointermove', 15, -25, null, 0);
      simulateEvent('pointerdrag', 15, -25, null, 0);
      simulateEvent('pointerup', 15, -25, null, 0);

      coordsZ1 = lineZ1.getGeometry().getCoordinates();
      coordsZ2 = lineZ2.getGeometry().getCoordinates();

      assert.deepEqual(coordsZ1[0], [-10, -10, 100]);
      assert.deepEqual(coordsZ1[1], [15, 25, 200]);

      assert.deepEqual(coordsZ2[0], [-10, -10, 999]);
      assert.deepEqual(coordsZ2[1], [15, 25, 888]);
    });

    it('matches XY and XYZ vertices with sharedVerticesEqual', function () {
      const lineXYZ = new Feature({
        geometry: new LineString([
          [0, 0, 100],
          [10, 20, 200],
          [0, 40, 300],
        ]),
      });
      const lineXY = new Feature({
        geometry: new LineString([
          [0, 0],
          [10, 20],
          [0, 40],
        ]),
      });
      features.length = 0;
      features.push(lineXYZ, lineXY);

      const modify = new Modify({
        features: new Collection(features),
        sharedVerticesEqual: function (a, b) {
          return a[0] === b[0] && a[1] === b[1];
        },
      });
      map.addInteraction(modify);

      // Drag the first shared vertex from [0, 0] to [-10, -10]
      simulateEvent('pointermove', 0, 0, null, 0);
      simulateEvent('pointerdown', 0, 0, null, 0);
      simulateEvent('pointermove', -10, 10, null, 0);
      simulateEvent('pointerdrag', -10, 10, null, 0);
      simulateEvent('pointerup', -10, 10, null, 0);

      let coordsXYZ = lineXYZ.getGeometry().getCoordinates();
      let coordsXY = lineXY.getGeometry().getCoordinates();

      assert.deepEqual(coordsXYZ[0], [-10, -10, 100]);
      assert.deepEqual(coordsXYZ[1], [10, 20, 200]);
      assert.deepEqual(coordsXYZ[2], [0, 40, 300]);

      assert.deepEqual(coordsXY[0], [-10, -10]);
      assert.deepEqual(coordsXY[1], [10, 20]);
      assert.deepEqual(coordsXY[2], [0, 40]);

      // Second drag: move the second shared vertex from [10, 20] to [15, 25]
      simulateEvent('pointermove', 10, -20, null, 0);
      simulateEvent('pointerdown', 10, -20, null, 0);
      simulateEvent('pointermove', 15, -25, null, 0);
      simulateEvent('pointerdrag', 15, -25, null, 0);
      simulateEvent('pointerup', 15, -25, null, 0);

      coordsXYZ = lineXYZ.getGeometry().getCoordinates();
      coordsXY = lineXY.getGeometry().getCoordinates();

      assert.deepEqual(coordsXYZ[0], [-10, -10, 100]);
      assert.deepEqual(coordsXYZ[1], [15, 25, 200]);
      assert.deepEqual(coordsXYZ[2], [0, 40, 300]);

      assert.deepEqual(coordsXY[0], [-10, -10]);
      assert.deepEqual(coordsXY[1], [15, 25]);
      assert.deepEqual(coordsXY[2], [0, 40]);
    });

    it('does not match vertices with different Z without sharedVerticesEqual', function () {
      const lineZ1 = new Feature({
        geometry: new LineString([
          [0, 0, 100],
          [10, 20, 200],
        ]),
      });
      const lineZ2 = new Feature({
        geometry: new LineString([
          [0, 0, 999],
          [10, 20, 888],
        ]),
      });
      features.length = 0;
      features.push(lineZ1, lineZ2);

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      // Drag from [0, 0] — without sharedVerticesEqual, only one line should move
      simulateEvent('pointermove', 0, 0, null, 0);
      simulateEvent('pointerdown', 0, 0, null, 0);
      simulateEvent('pointermove', -10, 10, null, 0);
      simulateEvent('pointerdrag', -10, 10, null, 0);
      simulateEvent('pointerup', -10, 10, null, 0);

      const coordsZ1 = lineZ1.getGeometry().getCoordinates();
      const coordsZ2 = lineZ2.getGeometry().getCoordinates();

      // Only one line should have moved (default behavior compares all dimensions)
      const z1Moved = coordsZ1[0][0] === -10 && coordsZ1[0][1] === -10;
      const z2Moved = coordsZ2[0][0] === -10 && coordsZ2[0][1] === -10;
      assert.strictEqual(z1Moved !== z2Moved, true);
    });

    it('keeps polygon geometries valid', function () {
      const overlappingVertexFeature = new Feature({
        geometry: new Polygon([
          [
            [10, 20],
            [0, 20],
            [0, 0],
            [20, 0],
            [20, 20],
            [10, 20],
            [15, 15],
            [5, 15],
            [10, 20],
          ],
        ]),
      });
      features.length = 0;
      features.push(overlappingVertexFeature);

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      let coords, exteriorRing;
      coords = overlappingVertexFeature.getGeometry().getCoordinates();
      exteriorRing = coords[0];

      assert.equal(exteriorRing.length, 9);
      assert.deepEqual(exteriorRing[0], exteriorRing[exteriorRing.length - 1]);

      // move the overlapping vertice
      simulateEvent('pointermove', 10, -20, null, 0);
      simulateEvent('pointerdown', 10, -20, null, 0);
      simulateEvent('pointermove', 10, -25, null, 0);
      simulateEvent('pointerdrag', 10, -25, null, 0);
      simulateEvent('pointerup', 10, -25, null, 0);

      coords = overlappingVertexFeature.getGeometry().getCoordinates();
      exteriorRing = coords[0];

      assert.equal(exteriorRing.length, 9);
      assert.deepEqual(exteriorRing[0], [10, 25]);
      assert.deepEqual(exteriorRing[0], exteriorRing[exteriorRing.length - 1]);
    });
  });

  describe('vertex insertion', function () {
    it('only inserts one vertex per geometry', function () {
      const lineFeature = new Feature({
        geometry: new LineString([
          [-10, -10],
          [10, 10],
          [-10, -10],
          [10, 10],
        ]),
      });
      features.length = 0;
      features.push(lineFeature);

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      // Click on line
      simulateEvent('pointermove', 0, 0, null, 0);
      simulateEvent('pointerdown', 0, 0, null, 0);
      simulateEvent('pointerup', 0, 0, null, 0);

      assert.equal(lineFeature.getGeometry().getCoordinates().length, 5);
    });
    it('inserts one vertex into both linestrings with duplicate segments each', function () {
      const lineFeature1 = new Feature(
        new LineString([
          [-10, -10],
          [10, 10],
          [-10, -10],
        ]),
      );
      const lineFeature2 = new Feature(
        new LineString([
          [10, 10],
          [-10, -10],
          [10, 10],
        ]),
      );
      features.length = 0;
      features.push(lineFeature1, lineFeature2);

      const modify = new Modify({
        features: new Collection(features),
      });
      let modifiedFeatures;

      const onModifyStart = function (evt) {
        modifiedFeatures = evt.features;
      };
      map.addInteraction(modify);

      modify.on('modifystart', onModifyStart);
      // Click on line
      simulateEvent('pointermove', 0, 0, null, 0);
      simulateEvent('pointerdown', 0, 0, null, 0);
      simulateEvent('pointerup', 0, 0, null, 0);
      modify.un('modifystart', onModifyStart);

      assert.strictEqual(lineFeature1.getGeometry().getCoordinates().length, 4);
      assert.strictEqual(lineFeature2.getGeometry().getCoordinates().length, 4);
      assert.deepEqual(modifiedFeatures.getArray(), [
        lineFeature1,
        lineFeature2,
      ]);
    });
    it('insertPoint() inserts a vertex into a LineString programmatically', function () {
      const lineFeature = new Feature({
        geometry: new LineString([
          [-10, -10],
          [10, 10],
        ]),
      });
      features.length = 0;
      features.push(lineFeature);

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      simulateEvent('pointermove', 0, 0, null, 0);

      assert.equal(lineFeature.getGeometry().getCoordinates().length, 2);

      const inserted = modify.insertPoint();
      assert.strictEqual(inserted, true);

      assert.equal(lineFeature.getGeometry().getCoordinates().length, 3);
    });
    it('insertPoint() inserts the provided vertex into a LineString programmatically', function () {
      const lineFeature = new Feature({
        geometry: new LineString([
          [-10, -10],
          [10, 10],
        ]),
      });
      features.length = 0;
      features.push(lineFeature);

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      assert.equal(lineFeature.getGeometry().getCoordinates().length, 2);

      const inserted = modify.insertPoint([0, 0]);
      assert.strictEqual(inserted, true);

      assert.equal(lineFeature.getGeometry().getCoordinates().length, 3);
      assert.deepEqual(lineFeature.getGeometry().getCoordinates()[1], [0, 0]);
    });
    it('canInsertPoint() returns true when point can be inserted', function () {
      const lineFeature = new Feature({
        geometry: new LineString([
          [-10, -10],
          [10, 10],
        ]),
      });
      features.length = 0;
      features.push(lineFeature);

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      simulateEvent('pointermove', 0, 0, null, 0);

      assert.strictEqual(modify.canInsertPoint(), true);
    });
    it('canInsertPoint() returns false when point cannot be inserted', function () {
      const lineFeature = new Feature({
        geometry: new LineString([
          [-10, -10],
          [10, 10],
        ]),
      });
      features.length = 0;
      features.push(lineFeature);

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      simulateEvent('pointermove', 5, 50, null, 0);

      assert.strictEqual(modify.canInsertPoint(), false);
    });
  });

  describe('circle modification', function () {
    it('changes the circle radius and center', function () {
      const circleFeature = new Feature(new Circle([10, 10], 20));
      features.length = 0;
      features.push(circleFeature);

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      // Change center
      simulateEvent('pointermove', 10, -10, null, 0);
      simulateEvent('pointerdown', 10, -10, null, 0);
      simulateEvent('pointermove', 5, -5, null, 0);
      simulateEvent('pointerdrag', 5, -5, null, 0);
      simulateEvent('pointerup', 5, -5, null, 0);

      assert.equal(circleFeature.getGeometry().getRadius(), 20);
      assert.deepEqual(circleFeature.getGeometry().getCenter(), [5, 5]);

      // Increase radius along x axis
      simulateEvent('pointermove', 25, -4, null, 0);
      simulateEvent('pointerdown', 25, -4, null, 0);
      simulateEvent('pointermove', 30, -5, null, 0);
      simulateEvent('pointerdrag', 30, -5, null, 0);
      simulateEvent('pointerup', 30, -5, null, 0);

      assert.approximately(circleFeature.getGeometry().getRadius(), 25, 0.1);
      assert.deepEqual(circleFeature.getGeometry().getCenter(), [5, 5]);

      // Increase radius along y axis
      simulateEvent('pointermove', 4, -30, null, 0);
      simulateEvent('pointerdown', 4, -30, null, 0);
      simulateEvent('pointermove', 5, -35, null, 0);
      simulateEvent('pointerdrag', 5, -35, null, 0);
      simulateEvent('pointerup', 5, -35, null, 0);

      assert.approximately(circleFeature.getGeometry().getRadius(), 30, 0.1);
      assert.deepEqual(circleFeature.getGeometry().getCenter(), [5, 5]);
    });

    it('changes the circle radius and center in a user projection', function () {
      const userProjection = 'EPSG:3857';
      setUserProjection(userProjection);
      const viewProjection = map.getView().getProjection();

      const circleFeature = new Feature(
        new Circle([10, 10], 20).transform(viewProjection, userProjection),
      );
      features.length = 0;
      features.push(circleFeature);

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      // Change center
      simulateEvent('pointermove', 10, -10, null, 0);
      simulateEvent('pointerdown', 10, -10, null, 0);
      simulateEvent('pointermove', 5, -5, null, 0);
      simulateEvent('pointerdrag', 5, -5, null, 0);
      simulateEvent('pointerup', 5, -5, null, 0);

      const geometry1 = circleFeature
        .getGeometry()
        .clone()
        .transform(userProjection, viewProjection);
      assert.approximately(geometry1.getRadius(), 20, 1e-9);
      assert.deepEqual(geometry1.getCenter(), [5, 5]);

      // Increase radius along x axis
      simulateEvent('pointermove', 25, -4, null, 0);
      simulateEvent('pointerdown', 25, -4, null, 0);
      simulateEvent('pointermove', 30, -5, null, 0);
      simulateEvent('pointerdrag', 30, -5, null, 0);
      simulateEvent('pointerup', 30, -5, null, 0);

      const geometry2 = circleFeature
        .getGeometry()
        .clone()
        .transform(userProjection, viewProjection);
      assert.approximately(geometry2.getRadius(), 25, 0.1);
      assert.deepEqual(geometry2.getCenter(), [5, 5]);

      // Increase radius along y axis
      simulateEvent('pointermove', 4, -30, null, 0);
      simulateEvent('pointerdown', 4, -30, null, 0);
      simulateEvent('pointermove', 5, -35, null, 0);
      simulateEvent('pointerdrag', 5, -35, null, 0);
      simulateEvent('pointerup', 5, -35, null, 0);

      const geometry3 = circleFeature
        .getGeometry()
        .clone()
        .transform(userProjection, viewProjection);
      assert.approximately(geometry3.getRadius(), 30, 0.1);
      assert.deepEqual(geometry3.getCenter(), [5, 5]);
    });
  });

  describe('boundary modification', function () {
    let modify, feature, events;

    beforeEach(function () {
      features.push(new Feature(new Point([12, 34])));
      modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      feature = features[0];

      events = trackEvents(feature, modify);
    });

    it('clicking vertex should delete it and +r1', function () {
      assert.equal(feature.getGeometry().getRevision(), 1);
      assert.lengthOf(feature.getGeometry().getCoordinates()[0], 5);

      simulateEvent('pointerdown', 10, -20, {alt: true}, 0);
      simulateEvent('pointerup', 10, -20, {alt: true}, 0);
      simulateEvent('click', 10, -20, {alt: true}, 0);
      simulateEvent('singleclick', 10, -20, {alt: true}, 0);

      assert.equal(feature.getGeometry().getRevision(), 2);
      assert.lengthOf(feature.getGeometry().getCoordinates()[0], 4);

      validateEvents(events, [feature]);
    });

    it('single clicking boundary should add vertex and +r1', function () {
      assert.equal(feature.getGeometry().getRevision(), 1);
      assert.lengthOf(feature.getGeometry().getCoordinates()[0], 5);

      simulateEvent('pointerdown', 40, -20, null, 0);
      simulateEvent('pointerup', 40, -20, null, 0);
      simulateEvent('click', 40, -20, null, 0);
      simulateEvent('singleclick', 40, -20, null, 0);

      assert.equal(feature.getGeometry().getRevision(), 2);
      assert.lengthOf(feature.getGeometry().getCoordinates()[0], 6);

      validateEvents(events, [feature]);
    });

    it('single clicking on created vertex should delete it again', function () {
      assert.equal(feature.getGeometry().getRevision(), 1);
      assert.lengthOf(feature.getGeometry().getCoordinates()[0], 5);

      simulateEvent('pointerdown', 40, -20, null, 0);
      simulateEvent('pointerup', 40, -20, null, 0);
      simulateEvent('click', 40, -20, null, 0);
      simulateEvent('singleclick', 40, -20, null, 0);

      assert.equal(feature.getGeometry().getRevision(), 2);
      assert.lengthOf(feature.getGeometry().getCoordinates()[0], 6);

      validateEvents(events, [feature]);
      events.length = 0;

      simulateEvent('pointerdown', 40, -20, {alt: true}, 0);
      simulateEvent('pointerup', 40, -20, {alt: true}, 0);
      simulateEvent('click', 40, -20, {alt: true}, 0);
      simulateEvent('singleclick', 40, -20, {alt: true}, 0);

      assert.equal(feature.getGeometry().getRevision(), 3);
      assert.lengthOf(feature.getGeometry().getCoordinates()[0], 5);

      validateEvents(events, [feature]);
    });

    it('clicking with drag should add vertex and +r2', function () {
      assert.equal(feature.getGeometry().getRevision(), 1);
      assert.lengthOf(feature.getGeometry().getCoordinates()[0], 5);

      simulateEvent('pointermove', 40, -20, null, 0);
      simulateEvent('pointerdown', 40, -20, null, 0);
      simulateEvent('pointermove', 30, -20, null, 0);
      simulateEvent('pointerdrag', 30, -20, null, 0);
      simulateEvent('pointerup', 30, -20, null, 0);

      assert.equal(feature.getGeometry().getRevision(), 3);
      assert.lengthOf(feature.getGeometry().getCoordinates()[0], 6);

      validateEvents(events, [feature]);
    });

    it('clicking with right button should not add a vertex', function () {
      assert.equal(feature.getGeometry().getRevision(), 1);
      assert.lengthOf(feature.getGeometry().getCoordinates()[0], 5);

      simulateEvent('pointermove', 40, -20, null, 0);
      // right click
      simulateEvent('pointerdown', 40, -20, null, 1);
      simulateEvent('pointermove', 30, -20, null, 1);
      simulateEvent('pointerdrag', 30, -20, null, 1);
      simulateEvent('pointerup', 30, -20, null, 1);

      assert.equal(feature.getGeometry().getRevision(), 1);
      assert.lengthOf(feature.getGeometry().getCoordinates()[0], 5);
      assert.lengthOf(events, 0);
    });
  });

  describe('geometry collection modification', function () {
    it('all geometries should be modified', function () {
      const firstPolygon = new Polygon([
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0],
        ],
      ]);
      const secondPolygon = firstPolygon.clone();

      const firstLineString = new LineString([
        [-2, 0],
        [0, 0],
        [2, 0],
      ]);
      const secondLineString = new LineString([
        [0, 2],
        [0, 0],
        [0, -2],
      ]);

      const point = new Point([0, 0]);

      const circle = new Circle([0, 0], 1);

      const geometryCollection = new GeometryCollection([
        firstPolygon,
        secondPolygon,
        firstLineString,
        secondLineString,
        point,
        circle,
      ]);

      const feature = new Feature({
        geometry: geometryCollection,
      });

      features.length = 0;
      features.push(feature);

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      // Move vertex
      simulateEvent('pointermove', 0, 0, null, 0);
      simulateEvent('pointerdown', 0, 0, null, 0);
      simulateEvent('pointermove', -1, 0, null, 0);
      simulateEvent('pointerdrag', -1, 0, null, 0);
      simulateEvent('pointerup', -1, 0, null, 0);

      let geomCoords;
      geomCoords = firstPolygon.getCoordinates()[0];
      assert.equal(geomCoords[0][0], -1);
      assert.equal(geomCoords[0][1], 0);

      geomCoords = secondPolygon.getCoordinates()[0];
      assert.equal(geomCoords[0][0], -1);
      assert.equal(geomCoords[0][1], 0);

      geomCoords = firstLineString.getCoordinates();
      assert.equal(geomCoords[1][0], -1);
      assert.equal(geomCoords[1][1], 0);

      geomCoords = secondLineString.getCoordinates();
      assert.equal(geomCoords[1][0], -1);
      assert.equal(geomCoords[1][1], 0);

      geomCoords = point.getCoordinates();
      assert.equal(geomCoords[0], -1);
      assert.equal(geomCoords[1], 0);

      geomCoords = circle.getCenter();
      assert.equal(geomCoords[0], -1);
      assert.equal(geomCoords[1], 0);
    });
  });

  describe('double click deleteCondition', function () {
    let modify, feature, events;

    beforeEach(function () {
      modify = new Modify({
        features: new Collection(features),
        deleteCondition: doubleClick,
      });
      map.addInteraction(modify);

      feature = features[0];

      events = trackEvents(feature, modify);
    });

    it('should delete vertex on double click', function () {
      assert.equal(feature.getGeometry().getRevision(), 1);
      assert.lengthOf(feature.getGeometry().getCoordinates()[0], 5);

      simulateEvent('pointerdown', 10, -20, null, 0);
      simulateEvent('pointerup', 10, -20, null, 0);
      simulateEvent('click', 10, -20, null, 0);
      simulateEvent('pointerdown', 10, -20, null, 0);
      simulateEvent('pointerup', 10, -20, null, 0);
      simulateEvent('click', 10, -20, null, 0);
      simulateEvent('dblclick', 10, -20, null, 0);

      assert.equal(feature.getGeometry().getRevision(), 2);
      assert.lengthOf(feature.getGeometry().getCoordinates()[0], 4);

      validateEvents(events, features);
    });

    it('should do nothing on single click', function () {
      assert.equal(feature.getGeometry().getRevision(), 1);
      assert.lengthOf(feature.getGeometry().getCoordinates()[0], 5);

      simulateEvent('pointerdown', 10, -20, null, 0);
      simulateEvent('pointerup', 10, -20, null, 0);
      simulateEvent('click', 10, -20, null, 0);
      simulateEvent('singleclick', 10, -20, null, 0);

      assert.equal(feature.getGeometry().getRevision(), 1);
      assert.lengthOf(feature.getGeometry().getCoordinates()[0], 5);

      assert.deepEqual(events.length, 0);
    });
  });

  describe('insertVertexCondition', function () {
    it('calls the callback function', function () {
      const listenerSpy = sinonSpy(function (event) {
        return false;
      });

      const modify = new Modify({
        features: new Collection(features),
        insertVertexCondition: listenerSpy,
      });
      map.addInteraction(modify);
      const feature = features[0];

      // move first vertex
      simulateEvent('pointermove', 0, 0, null, 0);
      simulateEvent('pointerdown', 0, 0, null, 0);
      simulateEvent('pointermove', -10, -10, null, 0);
      simulateEvent('pointerdrag', -10, -10, null, 0);
      simulateEvent('pointerup', -10, -10, null, 0);

      assert.strictEqual(listenerSpy.callCount, 0);
      assert.lengthOf(feature.getGeometry().getCoordinates()[0], 5);

      // try to add vertex
      simulateEvent('pointerdown', 40, -20, null, 0);
      simulateEvent('pointerup', 40, -20, null, 0);
      simulateEvent('click', 40, -20, null, 0);
      simulateEvent('singleclick', 40, -20, null, 0);

      assert.strictEqual(listenerSpy.callCount, 1);
      assert.lengthOf(feature.getGeometry().getCoordinates()[0], 5);
    });

    it('does not fire `modifystart` when nothing is modified', function (done) {
      const modify = new Modify({
        features: new Collection(features),
        insertVertexCondition: never,
      });
      map.addInteraction(modify);

      let modifystart = false;
      modify.on('modifystart', function () {
        modifystart = true;
      });

      // try to add vertex
      simulateEvent('pointermove', 40, -20, null, 0);
      simulateEvent('pointerdown', 40, -20, null, 0);
      simulateEvent('pointermove', 42, -30, null, 0);
      simulateEvent('pointerdrag', 42, -30, null, 0);
      simulateEvent('pointerup', 42, -30, null, 0);
      simulateEvent('click', 42, -30, null, 0);
      simulateEvent('singleclick', 42, -30, null, 0);

      setTimeout(function () {
        assert.strictEqual(modifystart, false);
        done();
      }, 0);
    });

    it('does not fire `modifyend` when nothing is modified', function (done) {
      const modify = new Modify({
        features: new Collection(features),
        deleteCondition: click,
        insertVertexCondition: never,
      });
      map.addInteraction(modify);

      let modifyend = false;
      modify.on('modifyend', function (e) {
        modifyend = true;
      });

      // try to add vertex
      simulateEvent('pointermove', 40, -20, null, 0);
      simulateEvent('pointerdown', 40, -20, null, 0);
      simulateEvent('pointerdrag', 42, -30, null, 0);
      simulateEvent('pointerup', 42, -30, null, 0);
      simulateEvent('click', 42, -30, null, 0);
      simulateEvent('singleclick', 42, -30, null, 0);

      setTimeout(function () {
        assert.strictEqual(modifyend, false);
        done();
      }, 0);
    });

    it('does not create an overlay vertex feature on `pointermove` when insertVertexCondition is not fulfilled', function () {
      const feature = new Feature({
        geometry: new LineString([
          [0, 0],
          [10, 20],
          [0, 40],
          [40, 40],
          [40, 0],
        ]),
      });
      const firstRevision = feature.getGeometry().getRevision();
      features.length = 0;
      features.push(feature);
      const listenerSpy = sinonSpy(() => false);
      const modify = new Modify({
        features: new Collection(features),
        insertVertexCondition: listenerSpy,
      });
      map.addInteraction(modify);

      // try to add vertex - should not be possible due to the insertVertexCondition
      simulateEvent('pointermove', 40, -20, null, 0);
      assert.strictEqual(modify.vertexFeature_, null);
      simulateEvent('pointerdown', 40, -20, null, 0);
      simulateEvent('pointermove', 60, -20, null, 0);
      assert.strictEqual(modify.vertexFeature_, null);
      simulateEvent('pointerdrag', 60, -20, null, 0);
      simulateEvent('pointerup', 60, -20, null, 0);

      assert.strictEqual(listenerSpy.callCount, 2);
      assert.equal(feature.getGeometry().getRevision(), firstRevision);
      assert.deepEqual(feature.getGeometry().getCoordinates().length, 5);
    });

    it('does not prevent moving vertices', function () {
      const feature = new Feature({
        geometry: new LineString([
          [0, 0],
          [10, 20],
          [0, 40],
          [40, 40],
          [40, 0],
        ]),
      });
      const firstRevision = feature.getGeometry().getRevision();
      features.length = 0;
      features.push(feature);
      const listenerSpy = sinonSpy(() => false);
      const modify = new Modify({
        features: new Collection(features),
        insertVertexCondition: listenerSpy,
      });
      map.addInteraction(modify);

      // move first vertex - should be possible
      simulateEvent('pointermove', 0, 0, null, 0);
      assert.notEqual(modify.vertexFeature_, null);
      simulateEvent('pointerdown', 0, 0, null, 0);
      simulateEvent('pointermove', -20, 20, null, 0);
      simulateEvent('pointerdrag', -20, 20, null, 0);
      simulateEvent('pointerup', -20, 20, null, 0);

      assert.strictEqual(listenerSpy.callCount, 0);
      assert.equal(feature.getGeometry().getRevision(), firstRevision + 1);
      assert.deepEqual(feature.getGeometry().getCoordinates().length, 5);
      assert.deepEqual(feature.getGeometry().getCoordinates()[0], [-20, -20]);
    });
  });

  describe('handle feature change', function () {
    let getModifyListeners;

    beforeEach(function () {
      getModifyListeners = function (feature, modify) {
        const listeners = feature.listeners_['change'];
        const candidates = Object.values(modify);
        return listeners.filter(function (listener) {
          return candidates.includes(listener);
        });
      };
    });

    it('updates circle segment data', function () {
      const feature = new Feature(new Circle([10, 10], 20));
      features.length = 0;
      features.push(feature);

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      let listeners;

      listeners = getModifyListeners(feature, modify);
      assert.lengthOf(listeners, 1);

      let firstSegmentData;

      firstSegmentData = modify.rBush_.forEachInExtent(
        [0, 0, 5, 5],
        function (node) {
          return node;
        },
      );
      assert.deepEqual(firstSegmentData.segment[0], [10, 10]);
      assert.deepEqual(firstSegmentData.segment[1], [10, 10]);

      const center = feature.getGeometry().getCenter();
      center[0] = 1;
      center[1] = 1;
      feature.getGeometry().setCenter(center);

      firstSegmentData = modify.rBush_.forEachInExtent(
        [0, 0, 5, 5],
        function (node) {
          return node;
        },
      );
      assert.deepEqual(firstSegmentData.segment[0], [1, 1]);
      assert.deepEqual(firstSegmentData.segment[1], [1, 1]);

      listeners = getModifyListeners(feature, modify);
      assert.lengthOf(listeners, 1);
    });

    it('updates polygon segment data', function () {
      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      const feature = features[0];
      let listeners;

      listeners = getModifyListeners(feature, modify);
      assert.lengthOf(listeners, 1);

      let firstSegmentData;

      firstSegmentData = modify.rBush_.forEachInExtent(
        [0, 0, 5, 5],
        function (node) {
          return node;
        },
      );
      assert.deepEqual(firstSegmentData.segment[0], [0, 0]);
      assert.deepEqual(firstSegmentData.segment[1], [10, 20]);

      const coordinates = feature.getGeometry().getCoordinates();
      const firstVertex = coordinates[0][0];
      firstVertex[0] = 1;
      firstVertex[1] = 1;
      feature.getGeometry().setCoordinates(coordinates);

      firstSegmentData = modify.rBush_.forEachInExtent(
        [0, 0, 5, 5],
        function (node) {
          return node;
        },
      );
      assert.deepEqual(firstSegmentData.segment[0], [1, 1]);
      assert.deepEqual(firstSegmentData.segment[1], [10, 20]);

      listeners = getModifyListeners(feature, modify);
      assert.lengthOf(listeners, 1);
    });
  });

  describe('handle feature removal during down-up sequence', function () {
    it('removes segment data of removed features from dragSegments_', function () {
      const collection = new Collection(features);
      const modify = new Modify({
        features: collection,
      });
      map.addInteraction(modify);
      simulateEvent('pointermove', 0, 0, null, 0);
      simulateEvent('pointerdown', 0, 0, null, 0);
      simulateEvent('pointermove', -10, -10, null, 0);
      simulateEvent('pointerdrag', -10, -10, null, 0);
      collection.remove(features[0]);
      assert.doesNotThrow(function () {
        simulateEvent('pointerup', -10, -10, null, 0);
      });
    });
  });

  describe('Vertex feature', function () {
    it('tracks features and geometries and removes the vertexFeature on deactivation', function () {
      const collection = new Collection(features);
      const modify = new Modify({
        features: collection,
      });
      map.addInteraction(modify);
      assert.strictEqual(modify.vertexFeature_, null);

      simulateEvent('pointermove', 10, -20, null, 0);
      assert.notEqual(modify.vertexFeature_, null);
      assert.strictEqual(modify.vertexFeature_.get('features').length, 1);
      assert.strictEqual(modify.vertexFeature_.get('geometries').length, 1);
      assert.strictEqual(modify.vertexFeature_.get('existing'), true);

      simulateEvent('pointermove', 40, -20, null, 0);
      assert.strictEqual(modify.vertexFeature_.get('existing'), false);

      modify.setActive(false);
      assert.strictEqual(modify.vertexFeature_, null);
      map.removeInteraction(modify);
    });

    it('tracks features and geometries - multi geometry', function () {
      const collection = new Collection();
      const modify = new Modify({
        features: collection,
      });
      map.addInteraction(modify);
      const feature = new Feature(
        new MultiPoint([
          [10, 10],
          [10, 20],
        ]),
      );
      collection.push(feature);
      simulateEvent('pointermove', 10, -20, null, 0);
      assert.deepEqual(modify.vertexFeature_.get('features')[0], feature);
      assert.deepEqual(
        modify.vertexFeature_.get('geometries')[0],
        feature.getGeometry(),
      );
      map.removeInteraction(modify);
    });

    it('tracks features and geometries - geometry collection', function () {
      const collection = new Collection();
      const modify = new Modify({
        features: collection,
      });
      map.addInteraction(modify);
      const feature = new Feature(
        new GeometryCollection([fromExtent([0, 0, 10, 10]), new Point([5, 5])]),
      );
      collection.push(feature);
      simulateEvent('pointermove', 5, -5, null, 0);
      assert.deepEqual(modify.vertexFeature_.get('features')[0], feature);
      assert.deepEqual(
        modify.vertexFeature_.get('geometries')[0],
        feature.getGeometry().getGeometriesArray()[1],
      );
    });

    it('works with hit detection of point features', function () {
      const modify = new Modify({
        hitDetection: layer,
        source: source,
      });
      map.addInteraction(modify);
      source.clear();
      const pointFeature = new Feature(new Point([0, 0]));
      source.addFeature(pointFeature);
      layer.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 30,
            fill: new Fill({
              color: 'fuchsia',
            }),
          }),
        }),
      );
      map.renderSync();
      simulateEvent('pointermove', 10, -10, null, 0);
      assert.deepEqual(modify.vertexFeature_.get('features')[0], pointFeature);
      assert.deepEqual(
        modify.vertexFeature_.get('geometries')[0].getCoordinates(),
        pointFeature.getGeometry().getCoordinates(),
      );
    });

    it('works with hit detection of point features with userGeographic()', function () {
      useGeographic();
      const modify = new Modify({
        hitDetection: layer,
        source: source,
      });
      map.setView(
        new View({
          center: [16, 48],
          zoom: map.getView().getZoom(),
        }),
      );
      map.addInteraction(modify);
      source.clear();
      const pointFeature = new Feature(new Point([16, 48]));
      source.addFeature(pointFeature);
      layer.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 30,
            fill: new Fill({
              color: 'fuchsia',
            }),
          }),
        }),
      );
      map.renderSync();
      simulateEvent('pointermove', 10, -10, null, 0);
      simulateEvent('pointerdown', 10, -10, null, 0);
      simulateEvent('pointerdrag', 0, 0, null, 0);
      simulateEvent('pointerup', 0, 0, null, 0);
      assert.deepEqual(modify.vertexFeature_.get('features')[0], pointFeature);
      assert.deepEqual(
        modify.vertexFeature_.get('geometries')[0].getCoordinates(),
        pointFeature.getGeometry().getCoordinates(),
      );
      clearUserProjection();
    });

    it('snaps to pointer by default', function () {
      const modify = new Modify({
        source: source,
      });
      map.addInteraction(modify);
      source.clear();
      const pointFeature = new Feature(new Point([0, 0]));
      source.addFeature(pointFeature);
      map.renderSync();
      simulateEvent('pointerdown', 2, 2, null, 0);
      simulateEvent('pointerdrag', 2, 2, null, 0);
      simulateEvent('pointerup', 2, 2, null, 0);
      assert.deepEqual(pointFeature.getGeometry().getCoordinates(), [2, -2]);
    });

    it('does not snap to pointer when snapToPointer is false', function () {
      const modify = new Modify({
        source: source,
        snapToPointer: false,
      });
      map.addInteraction(modify);
      source.clear();
      const pointFeature = new Feature(new Point([0, 0]));
      source.addFeature(pointFeature);
      map.renderSync();
      simulateEvent('pointerdown', 2, 2, null, 0);
      simulateEvent('pointerdrag', 2, 2, null, 0);
      simulateEvent('pointerup', 2, 2, null, 0);
      assert.deepEqual(pointFeature.getGeometry().getCoordinates(), [0, 0]);
    });
  });

  describe('#getOverlay', function () {
    it('returns the feature overlay layer', function () {
      const modify = new Modify({
        features: new Collection(),
      });
      assert.deepEqual(modify.getOverlay(), modify.overlay_);
    });
  });

  describe('#getPoint', function () {
    it('returns the current pointer coordinate', function () {
      const modify = new Modify({
        features: new Collection([new Feature(new Point([10, 20]))]),
      });
      map.addInteraction(modify);
      assert.strictEqual(modify.getPoint(), null);
      simulateEvent('pointermove', 10, -20, null, 0);
      assert.deepEqual(modify.getPoint(), [10, 20]);
    });
  });

  describe('circle modification with snap', function () {
    it('changes the circle radius and center', function () {
      const circleFeature = new Feature(new Circle([10, 10], 20));
      features.length = 0;
      features.push(circleFeature);

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      const snap = new Snap({
        features: new Collection(features),
        pixelTolerance: 1,
      });
      map.addInteraction(snap);

      // Change center
      simulateEvent('pointermove', 10, -10, null, 0);
      simulateEvent('pointerdown', 10, -10, null, 0);
      simulateEvent('pointermove', 5, -5, null, 0);
      simulateEvent('pointerdrag', 5, -5, null, 0);
      simulateEvent('pointerup', 5, -5, null, 0);

      assert.equal(circleFeature.getGeometry().getRadius(), 20);
      assert.deepEqual(circleFeature.getGeometry().getCenter(), [5, 5]);

      // Increase radius along x axis
      simulateEvent('pointermove', 25, -4, null, 0);
      simulateEvent('pointerdown', 25, -4, null, 0);
      simulateEvent('pointermove', 30, -5, null, 0);
      simulateEvent('pointerdrag', 30, -5, null, 0);
      simulateEvent('pointerup', 30, -5, null, 0);

      assert.approximately(circleFeature.getGeometry().getRadius(), 25, 1e-9);
      assert.deepEqual(circleFeature.getGeometry().getCenter(), [5, 5]);

      // Increase radius along y axis
      simulateEvent('pointermove', 4, -30, null, 0);
      simulateEvent('pointerdown', 4, -30, null, 0);
      simulateEvent('pointermove', 5, -35, null, 0);
      simulateEvent('pointerdrag', 5, -35, null, 0);
      simulateEvent('pointerup', 5, -35, null, 0);

      assert.equal(circleFeature.getGeometry().getRadius(), 30);
      assert.deepEqual(circleFeature.getGeometry().getCenter(), [5, 5]);
    });

    it('changes the circle radius and center in a user projection', function () {
      const userProjection = 'EPSG:3857';
      setUserProjection(userProjection);
      const viewProjection = map.getView().getProjection();

      const circleFeature = new Feature(
        new Circle([10, 10], 20).transform(viewProjection, userProjection),
      );
      features.length = 0;
      features.push(circleFeature);

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      const snap = new Snap({
        features: new Collection(features),
        pixelTolerance: 1,
      });
      map.addInteraction(snap);

      // Change center
      simulateEvent('pointermove', 10, -10, null, 0);
      simulateEvent('pointerdown', 10, -10, null, 0);
      simulateEvent('pointermove', 5, -5, null, 0);
      simulateEvent('pointerdrag', 5, -5, null, 0);
      simulateEvent('pointerup', 5, -5, null, 0);

      const geometry1 = circleFeature
        .getGeometry()
        .clone()
        .transform(userProjection, viewProjection);
      assert.approximately(geometry1.getRadius(), 20, 1e-9);
      assert.deepEqual(geometry1.getCenter(), [5, 5]);

      // Increase radius along x axis
      simulateEvent('pointermove', 25, -4, null, 0);
      simulateEvent('pointerdown', 25, -4, null, 0);
      simulateEvent('pointermove', 30, -5, null, 0);
      simulateEvent('pointerdrag', 30, -5, null, 0);
      simulateEvent('pointerup', 30, -5, null, 0);

      const geometry2 = circleFeature
        .getGeometry()
        .clone()
        .transform(userProjection, viewProjection);
      assert.approximately(geometry2.getRadius(), 25, 1e-9);
      assert.deepEqual(geometry2.getCenter(), [5, 5]);

      // Increase radius along y axis
      simulateEvent('pointermove', 4, -30, null, 0);
      simulateEvent('pointerdown', 4, -30, null, 0);
      simulateEvent('pointermove', 5, -35, null, 0);
      simulateEvent('pointerdrag', 5, -35, null, 0);
      simulateEvent('pointerup', 5, -35, null, 0);

      const geometry3 = circleFeature
        .getGeometry()
        .clone()
        .transform(userProjection, viewProjection);
      assert.approximately(geometry3.getRadius(), 30, 1e-9);
      assert.deepEqual(geometry3.getCenter(), [5, 5]);
    });
  });

  describe('Feature filter', function () {
    let firstRevision, modify, lineFeature;

    beforeEach(function () {
      source.clear();
      lineFeature = new Feature({
        geometry: new LineString([
          [0, 0],
          [10, 20],
          [0, 40],
          [40, 40],
          [40, 0],
        ]),
      });
      source.addFeature(lineFeature);

      modify = new Modify({
        source,
        filter: (feature) => {
          return feature.get('someProp') !== 'disqualifyingPropValue';
        },
      });
      map.addInteraction(modify);
    });

    it('allows modification of features that pass the filter', function () {
      lineFeature.set('someProp', 'allowablePropValue');
      firstRevision = lineFeature.getGeometry().getRevision();

      // Try to move a vertex
      simulateEvent('pointermove', 10, -20, null, 0);
      simulateEvent('pointerdown', 10, -20, null, 0);
      simulateEvent('pointermove', 5, -20, null, 0);
      simulateEvent('pointerdrag', 5, -20, null, 0);
      simulateEvent('pointerup', 5, -20, null, 0);
      assert.isAbove(lineFeature.getGeometry().getRevision(), firstRevision);
    });

    it('prevents modification of features that do not pass the filter', function () {
      firstRevision = lineFeature.getGeometry().getRevision();
      lineFeature.set('someProp', 'disqualifyingPropValue');
      // Try to move a vertex
      simulateEvent('pointermove', 10, -20, null, 0);
      simulateEvent('pointerdown', 10, -20, null, 0);
      simulateEvent('pointermove', 5, -20, null, 0);
      simulateEvent('pointerdrag', 5, -20, null, 0);
      simulateEvent('pointerup', 5, -20, null, 0);
      assert.equal(lineFeature.getGeometry().getRevision(), firstRevision);
    });
  });

  describe('Event Listeners on external Observables', function () {
    let modify, lineFeature;

    beforeEach(function () {
      lineFeature = new Feature({
        geometry: new LineString([
          [0, 0],
          [10, 20],
          [0, 40],
          [40, 40],
          [40, 0],
        ]),
      });
    });

    function getListeners(type, observable, modify) {
      const listeners = observable.listeners_?.[type] || [];
      const candidates = Object.values(modify);
      return listeners.filter(function (listener) {
        return candidates.includes(listener);
      });
    }

    it('are removed on dispose() when source is provided', function () {
      source.clear();
      source.addFeature(lineFeature);
      modify = new Modify({
        source,
        filter: (feature) => {
          return feature.get('someProp') !== 'disqualifyingPropValue';
        },
      });
      map.addInteraction(modify);

      //modify was constructed with a source containing only lineFeature
      let listeners = getListeners(EventType.CHANGE, lineFeature, modify);
      assert.equal(listeners.length, 1);
      //propertychange event handler won't be registered unless a filter function
      // is provided.  In this case it was.
      listeners = getListeners(
        ObjectEventType.PROPERTYCHANGE,
        lineFeature,
        modify,
      );
      assert.equal(listeners.length, 1);
      listeners = getListeners(VectorEventType.ADDFEATURE, source, modify);
      assert.equal(listeners.length, 1);
      listeners = getListeners(VectorEventType.REMOVEFEATURE, source, modify);
      assert.equal(listeners.length, 1);

      const newFeature = lineFeature.clone();
      source.addFeature(newFeature);
      listeners = getListeners(
        ObjectEventType.PROPERTYCHANGE,
        newFeature,
        modify,
      );
      assert.equal(listeners.length, 1);
      listeners = getListeners(EventType.CHANGE, newFeature, modify);
      assert.equal(listeners.length, 1);

      modify.dispose();
      listeners = getListeners(
        ObjectEventType.PROPERTYCHANGE,
        lineFeature,
        modify,
      );
      assert.equal(listeners.length, 0);
      listeners = getListeners(EventType.CHANGE, lineFeature, modify);
      assert.equal(listeners.length, 0);
      listeners = getListeners(
        ObjectEventType.PROPERTYCHANGE,
        newFeature,
        modify,
      );
      assert.equal(listeners.length, 0);
      listeners = getListeners(EventType.CHANGE, newFeature, modify);
      assert.equal(listeners.length, 0);
      listeners = getListeners(VectorEventType.ADDFEATURE, source, modify);
      assert.equal(listeners.length, 0);
      listeners = getListeners(VectorEventType.REMOVEFEATURE, source, modify);
      assert.equal(listeners.length, 0);
    });

    it('are removed on dispose() when feature collection is provided', function () {
      const featureCollection = new Collection();
      featureCollection.push(lineFeature);

      modify = new Modify({
        features: featureCollection,
        filter: (feature) => {
          return feature.get('someProp') !== 'disqualifyingPropValue';
        },
      });
      map.addInteraction(modify);

      let listeners = getListeners(EventType.CHANGE, lineFeature, modify);
      assert.equal(listeners.length, 1);
      //propertychange event handler won't be registered unless a filter function
      // is provided.  In this case it was.
      listeners = getListeners(
        ObjectEventType.PROPERTYCHANGE,
        lineFeature,
        modify,
      );
      assert.equal(listeners.length, 1);
      listeners = getListeners(
        CollectionEventType.ADD,
        featureCollection,
        modify,
      );
      assert.equal(listeners.length, 1);
      listeners = getListeners(
        CollectionEventType.REMOVE,
        featureCollection,
        modify,
      );
      assert.equal(listeners.length, 1);

      const newFeature = lineFeature.clone();
      featureCollection.push(newFeature);
      listeners = getListeners(
        ObjectEventType.PROPERTYCHANGE,
        newFeature,
        modify,
      );
      assert.equal(listeners.length, 1);
      listeners = getListeners(EventType.CHANGE, newFeature, modify);
      assert.equal(listeners.length, 1);

      modify.dispose();
      listeners = getListeners(
        ObjectEventType.PROPERTYCHANGE,
        lineFeature,
        modify,
      );
      assert.equal(listeners.length, 0);
      listeners = getListeners(EventType.CHANGE, lineFeature, modify);
      assert.equal(listeners.length, 0);
      listeners = getListeners(
        ObjectEventType.PROPERTYCHANGE,
        newFeature,
        modify,
      );
      assert.equal(listeners.length, 0);
      listeners = getListeners(EventType.CHANGE, newFeature, modify);
      assert.equal(listeners.length, 0);
      listeners = getListeners(
        CollectionEventType.ADD,
        featureCollection,
        modify,
      );
      assert.equal(listeners.length, 0);
      listeners = getListeners(
        CollectionEventType.REMOVE,
        featureCollection,
        modify,
      );
      assert.equal(listeners.length, 0);
    });
  });

  describe('tracing polygons', function () {
    let modify;

    beforeEach(function () {
      modify = new Modify({
        source: source,
        trace: true,
      });
      map.addInteraction(modify);
    });

    it('starts tracing with first edge drag, stops tracing with second edge drag', function () {
      const modifyFeature = new Feature(
        // a polygon we'll modify
        new Polygon([
          [
            [200, 0],
            [250, 0],
            [250, -150],
            [200, -150],
            [200, 0],
          ],
        ]),
      );
      source.addFeatures([
        new Feature(
          // a polygon we'll trace around
          new Polygon([
            [
              [0, -50],
              [100, -50],
              [100, -100],
              [0, -100],
              [0, -50],
            ],
          ]),
        ),
        modifyFeature,
      ]);

      // first drag activates tracing (center of bottom edge)
      simulateEvent('pointermove', 200, 100, null, 0);
      simulateEvent('pointerdown', 200, 100, null, 0);
      simulateEvent('pointermove', 50, 50, null, 0);
      simulateEvent('pointerdrag', 50, 50, null, 0);
      simulateEvent('pointerup', 50, 50, null, 0);

      assert.strictEqual(modify.traceState_.active, true);
      assert.strictEqual(modify.traceState_.targetIndex, -1);

      // decond drag ends tracing (right half of top edge)
      simulateEvent('pointermove', 200, 0, null, 0);
      simulateEvent('pointerdown', 200, 0, null, 0);
      simulateEvent('pointermove', 90, 100, null, 0);
      simulateEvent('pointerdrag', 90, 100, null, 0);
      simulateEvent('pointerup', 90, 100, null, 0);
      assert.strictEqual(modify.traceState_.active, false);

      const geometry = modifyFeature.getGeometry();

      assert.deepEqual(geometry.getCoordinates(), [
        [
          [90, -100], // second drag point
          [250, 0],
          [250, -150],
          [200, -150],
          [50, -50], // first drag point
          [100, -50], // traced point
          [100, -100], // traced point
        ],
      ]);
    });
  });

  describe('polygon first/last vertex synchronization', function () {
    it('keeps first and last vertex synchronized when dragging first vertex of Polygon', function () {
      const polygonFeature = new Feature({
        geometry: new Polygon([
          [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ],
        ]),
      });
      features.length = 0;
      features.push(polygonFeature);

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      const invalidStates = [];
      polygonFeature.on('change', function () {
        const coords = polygonFeature.getGeometry().getCoordinates()[0];
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          invalidStates.push({first: first.slice(), last: last.slice()});
        }
      });

      simulateEvent('pointermove', 0, 0, null, 0);
      simulateEvent('pointerdown', 0, 0, null, 0);
      simulateEvent('pointermove', 5, -5, null, 0);
      simulateEvent('pointerdrag', 5, -5, null, 0);
      simulateEvent('pointerup', 5, -5, null, 0);

      assert.strictEqual(invalidStates.length, 0);

      const finalCoords = polygonFeature.getGeometry().getCoordinates()[0];
      assert.deepEqual(finalCoords[0], finalCoords[finalCoords.length - 1]);
    });

    it('keeps first and last vertex synchronized when dragging first vertex of MultiPolygon', function () {
      const multiPolygonFeature = new Feature({
        geometry: new MultiPolygon([
          [
            [
              [0, 0],
              [10, 0],
              [10, 10],
              [0, 10],
              [0, 0],
            ],
          ],
        ]),
      });
      features.length = 0;
      features.push(multiPolygonFeature);

      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      const invalidStates = [];
      multiPolygonFeature.on('change', function () {
        const ring = multiPolygonFeature.getGeometry().getCoordinates()[0][0];
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          invalidStates.push({first: first.slice(), last: last.slice()});
        }
      });

      simulateEvent('pointermove', 0, 0, null, 0);
      simulateEvent('pointerdown', 0, 0, null, 0);
      simulateEvent('pointermove', 5, -5, null, 0);
      simulateEvent('pointerdrag', 5, -5, null, 0);
      simulateEvent('pointerup', 5, -5, null, 0);

      assert.strictEqual(invalidStates.length, 0);

      const finalCoords = multiPolygonFeature
        .getGeometry()
        .getCoordinates()[0][0];
      assert.deepEqual(finalCoords[0], finalCoords[finalCoords.length - 1]);
    });
  });
});
