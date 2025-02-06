import proj4 from 'proj4';
import Collection from '../../../../../src/ol/Collection.js';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../../src/ol/MapBrowserEvent.js';
import View from '../../../../../src/ol/View.js';
import {shiftKeyOnly} from '../../../../../src/ol/events/condition.js';
import Circle from '../../../../../src/ol/geom/Circle.js';
import GeometryCollection from '../../../../../src/ol/geom/GeometryCollection.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import Interaction from '../../../../../src/ol/interaction/Interaction.js';
import Translate, {
  TranslateEvent,
} from '../../../../../src/ol/interaction/Translate.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import {register} from '../../../../../src/ol/proj/proj4.js';
import {
  addCommon,
  clearAllProjections,
  clearUserProjection,
  setUserProjection,
} from '../../../../../src/ol/proj.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';

describe('ol.interaction.Translate', function () {
  let target, map, source, features;

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
    source = new VectorSource();
    features = [
      new Feature({
        geometry: new Point([10, -20]),
      }),
      new Feature({
        geometry: new Point([20, -30]),
      }),
    ];
    source.addFeatures(features);
    const layer = new VectorLayer({source: source});
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
    delete proj4.defs['EPSG:32637'];
    clearAllProjections();
    addCommon();
  });

  /**
   * Simulates a browser event on the map viewport.  The client x/y location
   * will be adjusted as if the map were centered at 0,0.
   * @param {string} type Event type.
   * @param {number} x Horizontal offset from map center.
   * @param {number} y Vertical offset from map center.
   * @param {boolean} [opt_shiftKey] Shift key is pressed.
   */
  function simulateEvent(type, x, y, opt_shiftKey) {
    const viewport = map.getViewport();
    // calculated in case body has top < 0 (test runner with small window)
    const position = viewport.getBoundingClientRect();
    const shiftKey = opt_shiftKey !== undefined ? opt_shiftKey : false;
    const event = new MapBrowserEvent(type, map, {
      type: type,
      target: viewport.firstChild,
      pointerId: 0,
      clientX: position.left + x + width / 2,
      clientY: position.top + y + height / 2,
      shiftKey: shiftKey,
      preventDefault: function () {},
    });
    map.handleMapBrowserEvent(event);
  }

  /**
   * Tracks events triggered by the interaction as well as feature
   * modifications. Helper function to
   * @param {Feature} feature Translated feature.
   * @param {Translate} interaction The interaction.
   * @return {Array<TranslateEvent|string>} events
   */
  function trackEvents(feature, interaction) {
    const events = [];
    feature.on('change', function (event) {
      events.push('change');
    });
    interaction.on('translatestart', function (event) {
      events.push(event);
    });
    interaction.on('translateend', function (event) {
      events.push(event);
    });
    return events;
  }

  /**
   * Validates the event array to verify proper event sequence. Checks
   * that first and last event are correct TranslateEvents and that feature
   * modifications event are in between.
   * @param {Array<TranslateEvent|string>} events The events.
   * @param {Array<Feature>} features The features.
   */
  function validateEvents(events, features) {
    const startevent = events[0];
    const endevent = events[events.length - 1];

    // first event should be translatestart
    expect(startevent).to.be.an(TranslateEvent);
    expect(startevent.type).to.eql('translatestart');

    // last event should be translateend
    expect(endevent).to.be.an(TranslateEvent);
    expect(endevent.type).to.eql('translateend');

    // make sure we get change events to events array
    expect(events.length > 2).to.be(true);
    // middle events should be feature modification events
    for (let i = 1; i < events.length - 1; i++) {
      expect(events[i]).to.equal('change');
    }

    // TranslateEvents should include the expected features
    expect(startevent.features.getArray()).to.eql(features);
    expect(endevent.features.getArray()).to.eql(features);
  }

  describe('constructor', function () {
    it('creates a new interaction', function () {
      const translate = new Translate({
        features: features,
      });
      expect(translate).to.be.a(Translate);
      expect(translate).to.be.a(Interaction);
    });
  });

  describe('setActive', function () {
    it('works when the map is not set', function () {
      const translate = new Translate({
        features: features,
      });
      expect(translate.getActive()).to.be(true);
      translate.setActive(false);
      expect(translate.getActive()).to.be(false);
    });
  });

  describe('moving features, with features option', function () {
    let translate;

    beforeEach(function () {
      translate = new Translate({
        features: new Collection([features[0]]),
      });
      map.addInteraction(translate);
    });

    it('moves a selected feature', function () {
      const events = trackEvents(features[0], translate);

      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerdrag', 50, -40);
      simulateEvent('pointerup', 50, -40);
      const geometry = features[0].getGeometry();
      expect(geometry).to.be.a(Point);
      expect(geometry.getCoordinates()).to.eql([50, 40]);

      validateEvents(events, [features[0]]);
    });

    it('does not move an unselected feature', function () {
      const events = trackEvents(features[0], translate);

      simulateEvent('pointermove', 20, 30);
      simulateEvent('pointerdown', 20, 30);
      simulateEvent('pointerdrag', 50, -40);
      simulateEvent('pointerup', 50, -40);
      const geometry = features[1].getGeometry();
      expect(geometry).to.be.a(Point);
      expect(geometry.getCoordinates()).to.eql([20, -30]);

      expect(events).to.be.empty();
    });
  });

  describe('moving features, without features option', function () {
    let translate;

    beforeEach(function () {
      translate = new Translate();
      map.addInteraction(translate);
    });

    it('moves only targeted feature', function () {
      const events = trackEvents(features[0], translate);

      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerdrag', 50, -40);
      simulateEvent('pointerup', 50, -40);
      expect(features[0].getGeometry().getCoordinates()).to.eql([50, 40]);
      expect(features[1].getGeometry().getCoordinates()).to.eql([20, -30]);

      validateEvents(events, [features[0]]);
    });
  });

  describe('moving features, with filter option', function () {
    let translate;

    beforeEach(function () {
      translate = new Translate({
        filter: function (feature, layer) {
          return feature == features[0];
        },
      });
      map.addInteraction(translate);
    });

    it('moves a filter-passing feature', function () {
      const events = trackEvents(features[0], translate);

      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerdrag', 50, -40);
      simulateEvent('pointerup', 50, -40);
      const geometry = features[0].getGeometry();
      expect(geometry).to.be.a(Point);
      expect(geometry.getCoordinates()).to.eql([50, 40]);

      validateEvents(events, [features[0]]);
    });

    it('does not move a filter-discarded feature', function () {
      const events = trackEvents(features[0], translate);

      simulateEvent('pointermove', 20, 30);
      simulateEvent('pointerdown', 20, 30);
      simulateEvent('pointerdrag', 50, -40);
      simulateEvent('pointerup', 50, -40);
      const geometry = features[1].getGeometry();
      expect(geometry).to.be.a(Point);
      expect(geometry.getCoordinates()).to.eql([20, -30]);

      expect(events).to.be.empty();
    });
  });

  describe('moving features, with condition option', function () {
    let translate;

    beforeEach(function () {
      translate = new Translate({condition: shiftKeyOnly});
      map.addInteraction(translate);
    });

    it('moves targeted feature when condition is met', function () {
      const events = trackEvents(features[0], translate);

      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20, true);
      simulateEvent('pointerdrag', 50, -40);
      simulateEvent('pointerup', 50, -40);
      expect(features[0].getGeometry().getCoordinates()).to.eql([50, 40]);

      validateEvents(events, [features[0]]);
    });

    it('does not move feature when condition is not met', function () {
      const events = trackEvents(features[0], translate);

      simulateEvent('pointermove', 20, 30);
      simulateEvent('pointerdown', 20, 30);
      simulateEvent('pointerdrag', 50, -40);
      simulateEvent('pointerup', 50, -40);
      expect(features[1].getGeometry().getCoordinates()).to.eql([20, -30]);

      expect(events).to.be.empty();
    });
  });

  describe('moving geometry collection, circle, polygon features', function () {
    let translate;

    beforeEach(function () {
      source.clear();
      translate = new Translate();
      map.addInteraction(translate);
    });

    it('moves in view projection', function (done) {
      const feature = new Feature(
        new GeometryCollection([
          new Circle([10, -10], 10),
          new Polygon([
            [
              [30, 0],
              [20, -20],
              [40, -20],
              [30, 0],
            ],
          ]),
        ]),
      );
      source.addFeature(feature);
      map.once('postrender', function () {
        const events = trackEvents(feature, translate);

        simulateEvent('pointermove', 10, 20);
        simulateEvent('pointerdown', 10, 20);
        simulateEvent('pointerdrag', 50, -40);
        simulateEvent('pointerup', 50, -40);

        const geometries = feature.getGeometry().getGeometriesArray();
        expect(geometries[0].getRadius()).to.equal(10);
        expect(geometries[0].getCenter()).to.eql([50, 50]);
        expect(geometries[1].getCoordinates()).to.eql([
          [
            [70, 60],
            [60, 40],
            [80, 40],
            [70, 60],
          ],
        ]);

        validateEvents(events, [feature]);
        done();
      });
    });

    it('moves in a non-parallel user projection', function (done) {
      proj4.defs(
        'EPSG:32637',
        '+proj=utm +zone=37 +datum=WGS84 +units=m +no_defs +type=crs',
      );
      register(proj4);
      const userProjection = 'EPSG:32637';
      setUserProjection(userProjection);
      const viewProjection = map.getView().getProjection();

      const feature = new Feature(
        new GeometryCollection([
          new Circle([10, -10], 10),
          new Polygon([
            [
              [30, 0],
              [20, -20],
              [40, -20],
              [30, 0],
            ],
          ]),
        ]).transform(viewProjection, userProjection),
      );
      source.addFeature(feature);
      map.once('postrender', function () {
        const events = trackEvents(feature, translate);

        simulateEvent('pointermove', 10, 20);
        simulateEvent('pointerdown', 10, 20);
        simulateEvent('pointerdrag', 50, -40);
        simulateEvent('pointerup', 50, -40);

        const geometries = feature.getGeometry().getGeometriesArray();
        const circle = geometries[0]
          .clone()
          .transform(userProjection, viewProjection);
        expect(circle.getRadius()).to.roughlyEqual(10, 1e-9);
        const center = circle.getCenter();
        expect(center[0]).to.roughlyEqual(50, 1e-9);
        expect(center[1]).to.roughlyEqual(50, 1e-9);
        const polygon = geometries[1]
          .clone()
          .transform(userProjection, viewProjection);
        const coordinates = polygon.getCoordinates()[0];
        expect(coordinates[0][0]).to.roughlyEqual(70, 1e-9);
        expect(coordinates[0][1]).to.roughlyEqual(60, 1e-9);
        expect(coordinates[1][0]).to.roughlyEqual(60, 1e-9);
        expect(coordinates[1][1]).to.roughlyEqual(40, 1e-9);
        expect(coordinates[2][0]).to.roughlyEqual(80, 1e-9);
        expect(coordinates[2][1]).to.roughlyEqual(40, 1e-9);
        expect(coordinates[3][0]).to.equal(coordinates[0][0]);
        expect(coordinates[3][1]).to.equal(coordinates[0][1]);

        validateEvents(events, [feature]);
        done();
      });
    });
  });

  describe('changes css cursor', function () {
    let element, translate;

    beforeEach(function () {
      translate = new Translate();
      map.addInteraction(translate);
      element = map.getViewport();
    });

    it('changes css cursor', function () {
      expect(element.classList.contains('ol-grabbing')).to.be(false);
      expect(element.classList.contains('ol-grab')).to.be(false);

      simulateEvent('pointermove', 10, 20);
      expect(element.classList.contains('ol-grabbing')).to.be(false);
      expect(element.classList.contains('ol-grab')).to.be(true);

      simulateEvent('pointerdown', 10, 20);
      expect(element.classList.contains('ol-grabbing')).to.be(true);
      expect(element.classList.contains('ol-grab')).to.be(false);

      simulateEvent('pointerup', 10, 20);
      expect(element.classList.contains('ol-grabbing')).to.be(false);
      expect(element.classList.contains('ol-grab')).to.be(true);

      simulateEvent('pointermove', 0, 0);
      expect(element.classList.contains('ol-grabbing')).to.be(false);
      expect(element.classList.contains('ol-grab')).to.be(false);
    });

    it('resets css cursor when interaction is deactivated while pointer is on feature', function () {
      simulateEvent('pointermove', 10, 20);
      expect(element.classList.contains('ol-grabbing')).to.be(false);
      expect(element.classList.contains('ol-grab')).to.be(true);

      translate.setActive(false);

      simulateEvent('pointermove', 0, 0);
      expect(element.classList.contains('ol-grabbing')).to.be(false);
      expect(element.classList.contains('ol-grab')).to.be(false);
    });

    it('resets css cursor interaction is removed while pointer is on feature', function () {
      simulateEvent('pointermove', 10, 20);
      expect(element.classList.contains('ol-grabbing')).to.be(false);
      expect(element.classList.contains('ol-grab')).to.be(true);

      map.removeInteraction(translate);

      simulateEvent('pointermove', 0, 0);
      expect(element.classList.contains('ol-grabbing')).to.be(false);
      expect(element.classList.contains('ol-grab')).to.be(false);
    });

    it('resets css cursor to existing cursor interaction is removed while pointer is on feature', function () {
      element.style.cursor = 'pointer';

      simulateEvent('pointermove', 10, 20);
      expect(element.classList.contains('ol-grabbing')).to.be(false);
      expect(element.classList.contains('ol-grab')).to.be(true);

      map.removeInteraction(translate);

      simulateEvent('pointermove', 0, 0);
      expect(element.classList.contains('ol-grabbing')).to.be(false);
      expect(element.classList.contains('ol-grab')).to.be(false);
    });
  });
});
