import Circle from '../../../../../src/ol/geom/Circle.js';
import CircleStyle from '../../../../../src/ol/style/Circle.js';
import Collection from '../../../../../src/ol/Collection.js';
import Event from '../../../../../src/ol/events/Event.js';
import Feature from '../../../../../src/ol/Feature.js';
import GeometryCollection from '../../../../../src/ol/geom/GeometryCollection.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import Map from '../../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../../src/ol/MapBrowserEvent.js';
import Modify, {ModifyEvent} from '../../../../../src/ol/interaction/Modify.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon, {fromExtent} from '../../../../../src/ol/geom/Polygon.js';
import Snap from '../../../../../src/ol/interaction/Snap.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import View from '../../../../../src/ol/View.js';
import {Fill, Style} from '../../../../../src/ol/style.js';
import {MultiPoint} from '../../../../../src/ol/geom.js';
import {
  clearUserProjection,
  setUserProjection,
} from '../../../../../src/ol/proj.js';
import {
  click,
  doubleClick,
  never,
} from '../../../../../src/ol/events/condition.js';

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
    map.dispose();
    document.body.removeChild(target);
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
    const pointerEvent = new Event();
    pointerEvent.type = type;
    pointerEvent.target = viewport.firstChild;
    pointerEvent.clientX = position.left + x + width / 2;
    pointerEvent.clientY = position.top + y + height / 2;
    pointerEvent.shiftKey = modifiers.shift || false;
    pointerEvent.altKey = modifiers.alt || false;
    pointerEvent.pointerId = 1;
    pointerEvent.preventDefault = function () {};
    pointerEvent.button = button;
    pointerEvent.isPrimary = true;
    const event = new MapBrowserEvent(type, map, pointerEvent);
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
   * @param {Array<ol.Feature>} features The features.
   */
  function validateEvents(events, features) {
    const startevent = events[0];
    const endevent = events[events.length - 1];

    // first event should be modifystart
    expect(startevent).to.be.a(ModifyEvent);
    expect(startevent.type).to.eql('modifystart');

    // last event should be modifyend
    expect(endevent).to.be.a(ModifyEvent);
    expect(endevent.type).to.eql('modifyend');

    // make sure we get change events to events array
    expect(events.length > 2).to.be(true);
    // middle events should be feature modification events
    for (let i = 1; i < events.length - 1; i++) {
      expect(events[i]).to.equal('change');
    }

    // ModifyEvents should include the expected features
    expect(startevent.features.getArray()).to.eql(features);
    expect(endevent.features.getArray()).to.eql(features);
  }

  describe('constructor', function () {
    it('adds features to the RTree', function () {
      const feature = new Feature(new Point([0, 0]));
      const features = new Collection([feature]);
      const modify = new Modify({
        features: features,
      });
      const rbushEntries = modify.rBush_.getAll();
      expect(rbushEntries.length).to.be(1);
      expect(rbushEntries[0].feature).to.be(feature);
    });

    it('accepts feature without geometry', function () {
      const feature = new Feature();
      const features = new Collection([feature]);
      const modify = new Modify({
        features: features,
      });
      let rbushEntries = modify.rBush_.getAll();
      expect(rbushEntries.length).to.be(0);

      feature.setGeometry(new Point([0, 10]));
      rbushEntries = modify.rBush_.getAll();
      expect(rbushEntries.length).to.be(1);
      expect(rbushEntries[0].feature).to.be(feature);
    });

    it('accepts a source', function () {
      const feature = new Feature(new Point([0, 0]));
      const source = new VectorSource({features: [feature]});
      const modify = new Modify({source: source});
      const rbushEntries = modify.rBush_.getAll();
      expect(rbushEntries.length).to.be(1);
      expect(rbushEntries[0].feature).to.be(feature);
    });

    it('accepts a hitDetection option', function () {
      const feature = new Feature(new Point([0, 0]));
      const source = new VectorSource({features: [feature]});
      const layer = new VectorLayer({source: source});
      const modify = new Modify({hitDetection: layer, source: source});
      const rbushEntries = modify.rBush_.getAll();
      expect(rbushEntries.length).to.be(1);
      expect(rbushEntries[0].feature).to.be(feature);
      expect(modify.hitDetection_).to.be(layer);
    });

    it('accepts a snapToPointer option', function () {
      const modify = new Modify({source: source, snapToPointer: true});
      expect(modify.snapToPointer_).to.be(true);
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

      expect(first.getGeometry().getRevision()).to.equal(firstRevision);
      expect(first.getGeometry().getCoordinates()[0]).to.have.length(5);
      expect(second.getGeometry().getRevision()).to.equal(secondRevision);
      expect(second.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointerdown', 10, -20, {alt: true}, 0);
      simulateEvent('pointerup', 10, -20, {alt: true}, 0);
      simulateEvent('click', 10, -20, {alt: true}, 0);
      simulateEvent('singleclick', 10, -20, {alt: true}, 0);

      expect(first.getGeometry().getRevision()).to.equal(firstRevision + 1);
      expect(first.getGeometry().getCoordinates()[0]).to.have.length(4);
      expect(second.getGeometry().getRevision()).to.equal(secondRevision + 1);
      expect(second.getGeometry().getCoordinates()[0]).to.have.length(4);

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

      expect(first.getGeometry().getRevision()).to.equal(firstRevision);
      expect(first.getGeometry().getCoordinates()).to.have.length(5);

      simulateEvent('pointerdown', 0, 0, {alt: true}, 0);
      simulateEvent('pointerup', 0, 0, {alt: true}, 0);
      simulateEvent('click', 0, 0, {alt: true}, 0);
      simulateEvent('singleclick', 0, 0, {alt: true}, 0);

      expect(first.getGeometry().getRevision()).to.equal(firstRevision + 1);
      expect(first.getGeometry().getCoordinates()).to.have.length(4);
      expect(first.getGeometry().getCoordinates()[0][0]).to.equal(10);
      expect(first.getGeometry().getCoordinates()[0][1]).to.equal(20);

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

      expect(first.getGeometry().getRevision()).to.equal(firstRevision);
      expect(first.getGeometry().getCoordinates()).to.have.length(5);

      simulateEvent('pointerdown', 40, 0, {alt: true}, 0);
      simulateEvent('pointerup', 40, 0, {alt: true}, 0);
      simulateEvent('click', 40, 0, {alt: true}, 0);
      simulateEvent('singleclick', 40, 0, {alt: true}, 0);

      expect(first.getGeometry().getRevision()).to.equal(firstRevision + 1);
      expect(first.getGeometry().getCoordinates()).to.have.length(4);
      expect(first.getGeometry().getCoordinates()[3][0]).to.equal(40);
      expect(first.getGeometry().getCoordinates()[3][1]).to.equal(40);

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

      expect(first.getGeometry().getRevision()).to.equal(firstRevision);
      expect(first.getGeometry().getCoordinates()).to.have.length(5);

      simulateEvent('pointerdown', 40, 0, null, 0);
      simulateEvent('pointerup', 40, 0, null, 0);

      const removed = modify.removePoint();

      expect(removed).to.be(true);
      expect(first.getGeometry().getRevision()).to.equal(firstRevision + 1);
      expect(first.getGeometry().getCoordinates()).to.have.length(4);
      expect(first.getGeometry().getCoordinates()[3][0]).to.equal(40);
      expect(first.getGeometry().getCoordinates()[3][1]).to.equal(40);

      validateEvents(events, features);
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

      expect(lineFeature.getGeometry().getCoordinates()[0][2]).to.equal(10);
      expect(lineFeature.getGeometry().getCoordinates()[2][2]).to.equal(30);
      expect(lineFeature.getGeometry().getCoordinates()[4][2]).to.equal(50);
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

      expect(exteriorRing.length).to.equal(9);
      expect(exteriorRing[0]).to.eql(exteriorRing[exteriorRing.length - 1]);

      // move the overlapping vertice
      simulateEvent('pointermove', 10, -20, null, 0);
      simulateEvent('pointerdown', 10, -20, null, 0);
      simulateEvent('pointermove', 10, -25, null, 0);
      simulateEvent('pointerdrag', 10, -25, null, 0);
      simulateEvent('pointerup', 10, -25, null, 0);

      coords = overlappingVertexFeature.getGeometry().getCoordinates();
      exteriorRing = coords[0];

      expect(exteriorRing.length).to.equal(9);
      expect(exteriorRing[0]).to.eql([10, 25]);
      expect(exteriorRing[0]).to.eql(exteriorRing[exteriorRing.length - 1]);
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

      expect(lineFeature.getGeometry().getCoordinates().length).to.equal(5);
    });
    it('inserts one vertex into both linestrings with duplicate segments each', function () {
      const lineFeature1 = new Feature(
        new LineString([
          [-10, -10],
          [10, 10],
          [-10, -10],
        ])
      );
      const lineFeature2 = new Feature(
        new LineString([
          [10, 10],
          [-10, -10],
          [10, 10],
        ])
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

      expect(lineFeature1.getGeometry().getCoordinates().length).to.be(4);
      expect(lineFeature2.getGeometry().getCoordinates().length).to.be(4);
      expect(modifiedFeatures.getArray()).to.eql([lineFeature1, lineFeature2]);
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

      expect(circleFeature.getGeometry().getRadius()).to.equal(20);
      expect(circleFeature.getGeometry().getCenter()).to.eql([5, 5]);

      // Increase radius along x axis
      simulateEvent('pointermove', 25, -4, null, 0);
      simulateEvent('pointerdown', 25, -4, null, 0);
      simulateEvent('pointermove', 30, -5, null, 0);
      simulateEvent('pointerdrag', 30, -5, null, 0);
      simulateEvent('pointerup', 30, -5, null, 0);

      expect(circleFeature.getGeometry().getRadius()).to.roughlyEqual(25, 0.1);
      expect(circleFeature.getGeometry().getCenter()).to.eql([5, 5]);

      // Increase radius along y axis
      simulateEvent('pointermove', 4, -30, null, 0);
      simulateEvent('pointerdown', 4, -30, null, 0);
      simulateEvent('pointermove', 5, -35, null, 0);
      simulateEvent('pointerdrag', 5, -35, null, 0);
      simulateEvent('pointerup', 5, -35, null, 0);

      expect(circleFeature.getGeometry().getRadius()).to.roughlyEqual(30, 0.1);
      expect(circleFeature.getGeometry().getCenter()).to.eql([5, 5]);
    });

    it('changes the circle radius and center in a user projection', function () {
      const userProjection = 'EPSG:3857';
      setUserProjection(userProjection);
      const viewProjection = map.getView().getProjection();

      const circleFeature = new Feature(
        new Circle([10, 10], 20).transform(viewProjection, userProjection)
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
      expect(geometry1.getRadius()).to.roughlyEqual(20, 1e-9);
      expect(geometry1.getCenter()).to.eql([5, 5]);

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
      expect(geometry2.getRadius()).to.roughlyEqual(25, 0.1);
      expect(geometry2.getCenter()).to.eql([5, 5]);

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
      expect(geometry3.getRadius()).to.roughlyEqual(30, 0.1);
      expect(geometry3.getCenter()).to.eql([5, 5]);
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
      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointerdown', 10, -20, {alt: true}, 0);
      simulateEvent('pointerup', 10, -20, {alt: true}, 0);
      simulateEvent('click', 10, -20, {alt: true}, 0);
      simulateEvent('singleclick', 10, -20, {alt: true}, 0);

      expect(feature.getGeometry().getRevision()).to.equal(2);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(4);

      validateEvents(events, [feature]);
    });

    it('single clicking boundary should add vertex and +r1', function () {
      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointerdown', 40, -20, null, 0);
      simulateEvent('pointerup', 40, -20, null, 0);
      simulateEvent('click', 40, -20, null, 0);
      simulateEvent('singleclick', 40, -20, null, 0);

      expect(feature.getGeometry().getRevision()).to.equal(2);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(6);

      validateEvents(events, [feature]);
    });

    it('single clicking on created vertex should delete it again', function () {
      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointerdown', 40, -20, null, 0);
      simulateEvent('pointerup', 40, -20, null, 0);
      simulateEvent('click', 40, -20, null, 0);
      simulateEvent('singleclick', 40, -20, null, 0);

      expect(feature.getGeometry().getRevision()).to.equal(2);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(6);

      validateEvents(events, [feature]);
      events.length = 0;

      simulateEvent('pointerdown', 40, -20, {alt: true}, 0);
      simulateEvent('pointerup', 40, -20, {alt: true}, 0);
      simulateEvent('click', 40, -20, {alt: true}, 0);
      simulateEvent('singleclick', 40, -20, {alt: true}, 0);

      expect(feature.getGeometry().getRevision()).to.equal(3);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      validateEvents(events, [feature]);
    });

    it('clicking with drag should add vertex and +r3', function () {
      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointermove', 40, -20, null, 0);
      simulateEvent('pointerdown', 40, -20, null, 0);
      simulateEvent('pointermove', 30, -20, null, 0);
      simulateEvent('pointerdrag', 30, -20, null, 0);
      simulateEvent('pointerup', 30, -20, null, 0);

      expect(feature.getGeometry().getRevision()).to.equal(4);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(6);

      validateEvents(events, [feature]);
    });

    it('clicking with right button should not add a vertex', function () {
      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointermove', 40, -20, null, 0);
      // right click
      simulateEvent('pointerdown', 40, -20, null, 1);
      simulateEvent('pointermove', 30, -20, null, 1);
      simulateEvent('pointerdrag', 30, -20, null, 1);
      simulateEvent('pointerup', 30, -20, null, 1);

      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);
      expect(events).to.have.length(0);
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
      expect(geomCoords[0][0]).to.equal(-1);
      expect(geomCoords[0][1]).to.equal(0);

      geomCoords = secondPolygon.getCoordinates()[0];
      expect(geomCoords[0][0]).to.equal(-1);
      expect(geomCoords[0][1]).to.equal(0);

      geomCoords = firstLineString.getCoordinates();
      expect(geomCoords[1][0]).to.equal(-1);
      expect(geomCoords[1][1]).to.equal(0);

      geomCoords = secondLineString.getCoordinates();
      expect(geomCoords[1][0]).to.equal(-1);
      expect(geomCoords[1][1]).to.equal(0);

      geomCoords = point.getCoordinates();
      expect(geomCoords[0]).to.equal(-1);
      expect(geomCoords[1]).to.equal(0);

      geomCoords = circle.getCenter();
      expect(geomCoords[0]).to.equal(-1);
      expect(geomCoords[1]).to.equal(0);
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
      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointerdown', 10, -20, null, 0);
      simulateEvent('pointerup', 10, -20, null, 0);
      simulateEvent('click', 10, -20, null, 0);
      simulateEvent('pointerdown', 10, -20, null, 0);
      simulateEvent('pointerup', 10, -20, null, 0);
      simulateEvent('click', 10, -20, null, 0);
      simulateEvent('dblclick', 10, -20, null, 0);

      expect(feature.getGeometry().getRevision()).to.equal(2);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(4);

      validateEvents(events, features);
    });

    it('should do nothing on single click', function () {
      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      simulateEvent('pointerdown', 10, -20, null, 0);
      simulateEvent('pointerup', 10, -20, null, 0);
      simulateEvent('click', 10, -20, null, 0);
      simulateEvent('singleclick', 10, -20, null, 0);

      expect(feature.getGeometry().getRevision()).to.equal(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      expect(events.length).to.eql(0);
    });
  });

  describe('insertVertexCondition', function () {
    it('calls the callback function', function () {
      const listenerSpy = sinon.spy(function (event) {
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

      expect(listenerSpy.callCount).to.be(0);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);

      // try to add vertex
      simulateEvent('pointerdown', 40, -20, null, 0);
      simulateEvent('pointerup', 40, -20, null, 0);
      simulateEvent('click', 40, -20, null, 0);
      simulateEvent('singleclick', 40, -20, null, 0);

      expect(listenerSpy.callCount).to.be(1);
      expect(feature.getGeometry().getCoordinates()[0]).to.have.length(5);
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
        expect(modifystart).to.be(false);
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
        expect(modifyend).to.be(false);
        done();
      }, 0);
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
      expect(listeners).to.have.length(1);

      let firstSegmentData;

      firstSegmentData = modify.rBush_.forEachInExtent(
        [0, 0, 5, 5],
        function (node) {
          return node;
        }
      );
      expect(firstSegmentData.segment[0]).to.eql([10, 10]);
      expect(firstSegmentData.segment[1]).to.eql([10, 10]);

      const center = feature.getGeometry().getCenter();
      center[0] = 1;
      center[1] = 1;
      feature.getGeometry().setCenter(center);

      firstSegmentData = modify.rBush_.forEachInExtent(
        [0, 0, 5, 5],
        function (node) {
          return node;
        }
      );
      expect(firstSegmentData.segment[0]).to.eql([1, 1]);
      expect(firstSegmentData.segment[1]).to.eql([1, 1]);

      listeners = getModifyListeners(feature, modify);
      expect(listeners).to.have.length(1);
    });

    it('updates polygon segment data', function () {
      const modify = new Modify({
        features: new Collection(features),
      });
      map.addInteraction(modify);

      const feature = features[0];
      let listeners;

      listeners = getModifyListeners(feature, modify);
      expect(listeners).to.have.length(1);

      let firstSegmentData;

      firstSegmentData = modify.rBush_.forEachInExtent(
        [0, 0, 5, 5],
        function (node) {
          return node;
        }
      );
      expect(firstSegmentData.segment[0]).to.eql([0, 0]);
      expect(firstSegmentData.segment[1]).to.eql([10, 20]);

      const coordinates = feature.getGeometry().getCoordinates();
      const firstVertex = coordinates[0][0];
      firstVertex[0] = 1;
      firstVertex[1] = 1;
      feature.getGeometry().setCoordinates(coordinates);

      firstSegmentData = modify.rBush_.forEachInExtent(
        [0, 0, 5, 5],
        function (node) {
          return node;
        }
      );
      expect(firstSegmentData.segment[0]).to.eql([1, 1]);
      expect(firstSegmentData.segment[1]).to.eql([10, 20]);

      listeners = getModifyListeners(feature, modify);
      expect(listeners).to.have.length(1);
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
      expect(function () {
        simulateEvent('pointerup', -10, -10, null, 0);
      }).to.not.throwException();
    });
  });

  describe('Vertex feature', function () {
    it('tracks features and geometries and removes the vertexFeature on deactivation', function () {
      const collection = new Collection(features);
      const modify = new Modify({
        features: collection,
      });
      map.addInteraction(modify);
      expect(modify.vertexFeature_).to.be(null);

      simulateEvent('pointermove', 10, -20, null, 0);
      expect(modify.vertexFeature_).to.not.be(null);
      expect(modify.vertexFeature_.get('features').length).to.be(1);
      expect(modify.vertexFeature_.get('geometries').length).to.be(1);

      modify.setActive(false);
      expect(modify.vertexFeature_).to.be(null);
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
        ])
      );
      collection.push(feature);
      simulateEvent('pointermove', 10, -20, null, 0);
      expect(modify.vertexFeature_.get('features')[0]).to.eql(feature);
      expect(modify.vertexFeature_.get('geometries')[0]).to.eql(
        feature.getGeometry()
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
        new GeometryCollection([fromExtent([0, 0, 10, 10]), new Point([5, 5])])
      );
      collection.push(feature);
      simulateEvent('pointermove', 5, -5, null, 0);
      expect(modify.vertexFeature_.get('features')[0]).to.eql(feature);
      expect(modify.vertexFeature_.get('geometries')[0]).to.eql(
        feature.getGeometry().getGeometriesArray()[1]
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
        })
      );
      map.renderSync();
      simulateEvent('pointermove', 10, -10, null, 0);
      expect(modify.vertexFeature_.get('features')[0]).to.eql(pointFeature);
      expect(modify.vertexFeature_.get('geometries')[0]).to.eql(
        pointFeature.getGeometry()
      );
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
      expect(pointFeature.getGeometry().getCoordinates()).to.eql([2, -2]);
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
      expect(pointFeature.getGeometry().getCoordinates()).to.eql([0, 0]);
    });
  });

  describe('#getOverlay', function () {
    it('returns the feature overlay layer', function () {
      const modify = new Modify({
        features: new Collection(),
      });
      expect(modify.getOverlay()).to.eql(modify.overlay_);
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

      expect(circleFeature.getGeometry().getRadius()).to.equal(20);
      expect(circleFeature.getGeometry().getCenter()).to.eql([5, 5]);

      // Increase radius along x axis
      simulateEvent('pointermove', 25, -4, null, 0);
      simulateEvent('pointerdown', 25, -4, null, 0);
      simulateEvent('pointermove', 30, -5, null, 0);
      simulateEvent('pointerdrag', 30, -5, null, 0);
      simulateEvent('pointerup', 30, -5, null, 0);

      expect(circleFeature.getGeometry().getRadius()).to.roughlyEqual(25, 1e-9);
      expect(circleFeature.getGeometry().getCenter()).to.eql([5, 5]);

      // Increase radius along y axis
      simulateEvent('pointermove', 4, -30, null, 0);
      simulateEvent('pointerdown', 4, -30, null, 0);
      simulateEvent('pointermove', 5, -35, null, 0);
      simulateEvent('pointerdrag', 5, -35, null, 0);
      simulateEvent('pointerup', 5, -35, null, 0);

      expect(circleFeature.getGeometry().getRadius()).to.equal(30);
      expect(circleFeature.getGeometry().getCenter()).to.eql([5, 5]);
    });

    it('changes the circle radius and center in a user projection', function () {
      const userProjection = 'EPSG:3857';
      setUserProjection(userProjection);
      const viewProjection = map.getView().getProjection();

      const circleFeature = new Feature(
        new Circle([10, 10], 20).transform(viewProjection, userProjection)
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
      expect(geometry1.getRadius()).to.roughlyEqual(20, 1e-9);
      expect(geometry1.getCenter()).to.eql([5, 5]);

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
      expect(geometry2.getRadius()).to.roughlyEqual(25, 1e-9);
      expect(geometry2.getCenter()).to.eql([5, 5]);

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
      expect(geometry3.getRadius()).to.roughlyEqual(30, 1e-9);
      expect(geometry3.getCenter()).to.eql([5, 5]);
    });
  });
});
