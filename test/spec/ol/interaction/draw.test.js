import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import MapBrowserPointerEvent from '../../../../src/ol/MapBrowserPointerEvent.js';
import View from '../../../../src/ol/View.js';
import {equals} from '../../../../src/ol/array.js';
import {listen} from '../../../../src/ol/events.js';
import {always, shiftKeyOnly, altKeyOnly} from '../../../../src/ol/events/condition.js';
import Circle from '../../../../src/ol/geom/Circle.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import Draw, {createRegularPolygon, createBox} from '../../../../src/ol/interaction/Draw.js';
import Interaction from '../../../../src/ol/interaction/Interaction.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import Event from '../../../../src/ol/events/Event.js';
import VectorSource from '../../../../src/ol/source/Vector.js';


describe('ol.interaction.Draw', () => {
  let target, map, source;

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
   * @return {module:ol/MapBrowserPointerEvent} The simulated event.
   */
  function simulateEvent(type, x, y, opt_shiftKey) {
    const viewport = map.getViewport();
    // calculated in case body has top < 0 (test runner with small window)
    const position = viewport.getBoundingClientRect();
    const shiftKey = opt_shiftKey !== undefined ? opt_shiftKey : false;
    const event = new Event();
    event.type = type;
    event.clientX = position.left + x + width / 2;
    event.clientY = position.top + y + height / 2;
    event.shiftKey = shiftKey;
    event.preventDefault = function() {};
    event.pointerType = 'mouse';
    event.pointerId = 0;
    const simulatedEvent = new MapBrowserPointerEvent(type, map, event);
    map.handleMapBrowserEvent(simulatedEvent);
    return simulatedEvent;
  }

  describe('constructor', () => {

    test('creates a new interaction', () => {
      const draw = new Draw({
        source: source,
        type: 'Point'
      });
      expect(draw).toBeInstanceOf(Draw);
      expect(draw).toBeInstanceOf(Interaction);
    });

    test('accepts a freehand option', () => {
      const draw = new Draw({
        source: source,
        type: 'LineString',
        freehand: true
      });

      const event = new PointerEvent('pointerdown', {
        clientX: 0,
        clientY: 0,
        shiftKey: false
      });

      expect(draw.freehandCondition_(event)).toBe(true);
    });

    test('accepts a dragVertexDelay option', () => {
      const draw = new Draw({
        source: source,
        type: 'LineString',
        dragVertexDelay: 42
      });
      expect(draw.dragVertexDelay_).toBe(42);
    });

  });

  describe('specifying a geometryName', () => {

    beforeEach(() => {
      const draw = new Draw({
        source: source,
        geometryName: 'the_geom',
        type: 'Point'
      });
      map.addInteraction(draw);
    });

    test('creates a feature with the correct geometryName', () => {
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);
      const features = source.getFeatures();
      const geometry = features[0].getGeometry();
      expect(features[0].getGeometryName()).toBe('the_geom');
      expect(geometry).toBeInstanceOf(Point);
    });
  });

  describe('specifying a clickTolerance', () => {
    beforeEach(() => {
      const draw = new Draw({
        source: source,
        type: 'Point',
        clickTolerance: 6
      });
      map.addInteraction(draw);
    });

    test('adds a point when below the tolerance', () => {
      let features;

      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 15, 25);
      features = source.getFeatures();
      expect(features).toHaveLength(0);

      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 14, 24);
      features = source.getFeatures();
      expect(features).toHaveLength(1);
    });
  });

  describe('drawing points', () => {
    let draw;

    beforeEach(() => {
      draw = new Draw({
        source: source,
        type: 'Point'
      });
      map.addInteraction(draw);
    });

    test('draws a point on click', () => {
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);
      const features = source.getFeatures();
      expect(features).toHaveLength(1);
      const geometry = features[0].getGeometry();
      expect(geometry).toBeInstanceOf(Point);
      expect(geometry.getCoordinates()).toEqual([10, -20]);
    });

    test('does not draw a point with a significant drag', () => {
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointermove', 18, 20);
      simulateEvent('pointerup', 18, 20);
      const features = source.getFeatures();
      expect(features).toHaveLength(0);
    });

    test('does not draw a point when modifier key is pressed', () => {
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20, true);
      simulateEvent('pointerup', 10, 20);
      const features = source.getFeatures();
      expect(features).toHaveLength(0);
    });

    test('triggers draw events', () => {
      const ds = sinon.spy();
      const de = sinon.spy();
      listen(draw, 'drawstart', ds);
      listen(draw, 'drawend', de);
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);
      expect(ds).to.be.called();
      expect(de).to.be.called();
      simulateEvent('pointermove', 20, 20);
      expect(ds.callCount).toBe(1);
      expect(de.callCount).toBe(1);
    });

    test('triggers drawend event before inserting the feature', () => {
      const receivedEvents = {
        end: 0,
        addfeature: 0
      };
      listen(draw, 'drawend',
        function() {
          expect(receivedEvents.end).toBe(0);
          expect(receivedEvents.addfeature).toBe(0);
          ++receivedEvents.end;
        });
      source.on('addfeature', function() {
        expect(receivedEvents.end).toBe(1);
        expect(receivedEvents.addfeature).toBe(0);
        receivedEvents.addfeature++;
      });
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);
      simulateEvent('pointermove', 20, 20);
      expect(receivedEvents.end).toBe(1);
      expect(receivedEvents.addfeature).toBe(1);
    });

    test(
      'works if finishDrawing is called when the sketch feature is not defined',
      () => {
        expect(function() {
          draw.finishDrawing();
        }).not.toThrow();
      }
    );

  });

  describe('drawing multipoints', () => {
    let draw;

    beforeEach(() => {
      draw = new Draw({
        source: source,
        type: 'MultiPoint'
      });
      map.addInteraction(draw);
    });

    test('draws multipoint on click', () => {
      simulateEvent('pointermove', 30, 15);
      simulateEvent('pointerdown', 30, 15);
      simulateEvent('pointerup', 30, 15);
      const features = source.getFeatures();
      expect(features).toHaveLength(1);
      const geometry = features[0].getGeometry();
      expect(geometry).toBeInstanceOf(MultiPoint);
      expect(geometry.getCoordinates()).toEqual([[30, -15]]);
    });

    test(
      'works if finishDrawing is called when the sketch feature is not defined',
      () => {
        expect(function() {
          draw.finishDrawing();
        }).not.toThrow();
      }
    );

  });

  describe('drawing linestrings', () => {
    let draw;

    beforeEach(() => {
      draw = new Draw({
        source: source,
        type: 'LineString'
      });
      map.addInteraction(draw);
    });

    test('draws linestring with clicks, finishing on last point', () => {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      // finish on second point
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      const features = source.getFeatures();
      expect(features).toHaveLength(1);
      const geometry = features[0].getGeometry();
      expect(geometry).toBeInstanceOf(LineString);
      expect(geometry.getCoordinates()).toEqual([[10, -20], [30, -20]]);
    });

    test('supports removeLastPoint while drawing', () => {

      draw.removeLastPoint();

      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 40, 30);
      simulateEvent('pointerdown', 40, 30);
      simulateEvent('pointerup', 40, 30);

      simulateEvent('pointermove', 100, 100);
      draw.removeLastPoint();

      // click near the removed point
      simulateEvent('pointermove', 39, 31);
      simulateEvent('pointerdown', 38, 31);
      simulateEvent('pointerup', 38, 31);

      expect(source.getFeatures()).toHaveLength(0);
    });

    test('supports freehand drawing for linestrings', () => {
      // freehand sequence
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20, true);
      simulateEvent('pointermove', 20, 30, true);
      simulateEvent('pointerdrag', 20, 30, true);
      simulateEvent('pointermove', 20, 40, true);
      simulateEvent('pointerdrag', 20, 40, true);
      simulateEvent('pointerup', 20, 40, true);

      const features = source.getFeatures();
      expect(features).toHaveLength(1);
      const geometry = features[0].getGeometry();
      expect(geometry).toBeInstanceOf(LineString);
      expect(geometry.getCoordinates()).toEqual([[10, -20], [20, -30], [20, -40]]);
    });

    test('allows freehand mode for part of the drawing', () => {

      // non-freehand
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);
      simulateEvent('pointermove', 20, 30);

      // freehand
      simulateEvent('pointermove', 20, 30, true);
      simulateEvent('pointerdrag', 20, 30, true);
      simulateEvent('pointermove', 30, 40, true);
      simulateEvent('pointerdrag', 30, 40, true);
      simulateEvent('pointermove', 40, 50, true);
      simulateEvent('pointerdrag', 40, 50, true);

      // non-freehand
      simulateEvent('pointerup', 40, 50);
      simulateEvent('pointermove', 50, 60);
      simulateEvent('pointerdown', 50, 60);
      simulateEvent('pointerup', 50, 60);
      simulateEvent('pointermove', 60, 70);
      simulateEvent('pointerdown', 60, 70);
      simulateEvent('pointerup', 60, 70);

      // finish
      simulateEvent('pointerdown', 60, 70);
      simulateEvent('pointerup', 60, 70);

      const features = source.getFeatures();
      // expect(features).to.have.length(1);
      const geometry = features[0].getGeometry();
      expect(geometry).toBeInstanceOf(LineString);
      expect(geometry.getCoordinates()).toEqual([[10, -20], [20, -30], [30, -40], [40, -50], [50, -60], [60, -70]]);
    });

    test('does not add a point with a significant drag', () => {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // drag map
      simulateEvent('pointermove', 15, 20);
      simulateEvent('pointerdown', 15, 20);
      simulateEvent('pointermove', 23, 20);
      simulateEvent('pointerup', 23, 20);

      // second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      // finish on second point
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      const features = source.getFeatures();
      expect(features).toHaveLength(1);
      const geometry = features[0].getGeometry();
      expect(geometry).toBeInstanceOf(LineString);
      expect(geometry.getCoordinates()).toEqual([[10, -20], [30, -20]]);
    });

    test('allows dragging of the vertex after dragVertexDelay', done => {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point, drag vertex
      simulateEvent('pointermove', 15, 20);
      simulateEvent('pointerdown', 15, 20);
      setTimeout(function() {
        simulateEvent('pointermove', 20, 10);
        simulateEvent('pointerdrag', 20, 10);
        simulateEvent('pointerup', 20, 10);
        // third point
        simulateEvent('pointermove', 30, 20);
        simulateEvent('pointerdown', 30, 20);
        simulateEvent('pointerup', 30, 20);

        // finish on third point
        simulateEvent('pointerdown', 30, 20);
        simulateEvent('pointerup', 30, 20);

        const features = source.getFeatures();
        expect(features).toHaveLength(1);
        const geometry = features[0].getGeometry();
        expect(geometry).toBeInstanceOf(LineString);
        expect(geometry.getCoordinates()).toEqual([[10, -20], [20, -10], [30, -20]]);

        done();
      }, 600);
    });

    test('triggers draw events', () => {
      const ds = sinon.spy();
      const de = sinon.spy();
      listen(draw, 'drawstart', ds);
      listen(draw, 'drawend', de);

      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      // finish on second point
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);
      simulateEvent('pointermove', 10, 20);

      expect(ds).to.be.called();
      expect(ds.callCount).toBe(1);
      expect(de).to.be.called();
      expect(de.callCount).toBe(1);
    });

    test(
      'works if finishDrawing is called when the sketch feature is not defined',
      () => {
        expect(function() {
          draw.finishDrawing();
        }).not.toThrow();
      }
    );

  });

  describe('drawing with a condition', () => {
    let draw;
    beforeEach(() => {
      draw = new Draw({
        source: source,
        type: 'LineString',
        condition: shiftKeyOnly,
        freehandCondition: altKeyOnly
      });
      map.addInteraction(draw);
    });

    test('finishes draw sequence correctly', () => {
      // first point
      simulateEvent('pointermove', 10, 20, true);
      simulateEvent('pointerdown', 10, 20, true);
      simulateEvent('pointerup', 10, 20, true);

      // second point
      simulateEvent('pointermove', 30, 20, true);
      simulateEvent('pointerdown', 30, 20, true);
      simulateEvent('pointerup', 30, 20, true);

      // finish on second point
      simulateEvent('pointerdown', 30, 20, true);
      simulateEvent('pointerup', 30, 20, true);

      const features = source.getFeatures();
      expect(features).toHaveLength(1);
      const geometry = features[0].getGeometry();
      expect(geometry).toBeInstanceOf(LineString);
      expect(geometry.getCoordinates()).toEqual([[10, -20], [30, -20]]);

      // without modifier, to be handled by the map's DragPan interaction
      simulateEvent('pointermove', 20, 20);
      simulateEvent('pointerdown', 20, 20);
      simulateEvent('pointermove', 10, 30);
      expect(draw.lastDragTime_).toBe(undefined);
    });
  });

  describe('drawing with a finishCondition', () => {
    beforeEach(() => {
      const draw = new Draw({
        source: source,
        type: 'LineString',
        finishCondition: function(event) {
          if (equals(event.coordinate, [30, -20])) {
            return true;
          }
          return false;
        }
      });
      map.addInteraction(draw);
    });

    test(
      'draws a linestring failing to finish it first, the finishes it',
      () => {
        let features;

        // first point
        simulateEvent('pointermove', 10, 20);
        simulateEvent('pointerdown', 10, 20);
        simulateEvent('pointerup', 10, 20);

        // second point
        simulateEvent('pointermove', 40, 30);
        simulateEvent('pointerdown', 40, 30);
        simulateEvent('pointerup', 40, 30);

        // try to finish on this point
        simulateEvent('pointerdown', 40, 30);
        simulateEvent('pointerup', 40, 30);

        features = source.getFeatures();
        expect(features).toHaveLength(0);

        // third point
        simulateEvent('pointermove', 30, 20);
        simulateEvent('pointerdown', 30, 20);
        simulateEvent('pointerup', 30, 20);

        //  finish on this point
        simulateEvent('pointerdown', 30, 20);
        simulateEvent('pointerup', 30, 20);

        features = source.getFeatures();
        expect(features).toHaveLength(1);
      }
    );
  });

  describe('drawing multi-linestrings', () => {
    let draw;

    beforeEach(() => {
      draw = new Draw({
        source: source,
        type: 'MultiLineString'
      });
      map.addInteraction(draw);
    });

    test('draws multi with clicks, finishing on last point', () => {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      // finish on second point
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      const features = source.getFeatures();
      expect(features).toHaveLength(1);
      const geometry = features[0].getGeometry();
      expect(geometry).toBeInstanceOf(MultiLineString);
      expect(geometry.getCoordinates()).toEqual([[[10, -20], [30, -20]]]);
    });

    test(
      'works if finishDrawing is called when the sketch feature is not defined',
      () => {
        expect(function() {
          draw.finishDrawing();
        }).not.toThrow();
      }
    );

  });

  describe('drawing polygons', () => {
    let draw;

    beforeEach(() => {
      draw = new Draw({
        source: source,
        type: 'Polygon'
      });
      map.addInteraction(draw);
    });

    function isClosed(polygon) {
      const first = polygon.getFirstCoordinate();
      const last = polygon.getLastCoordinate();
      expect(first).toEqual(last);
    }

    test('draws polygon with clicks, finishing on first point', () => {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);
      isClosed(draw.sketchFeature_.getGeometry());

      // second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);
      isClosed(draw.sketchFeature_.getGeometry());

      // third point
      simulateEvent('pointermove', 40, 10);
      simulateEvent('pointerdown', 40, 10);
      simulateEvent('pointerup', 40, 10);
      isClosed(draw.sketchFeature_.getGeometry());

      // finish on first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      const features = source.getFeatures();
      expect(features).toHaveLength(1);
      const geometry = features[0].getGeometry();
      expect(geometry).toBeInstanceOf(Polygon);

      expect(geometry.getCoordinates()).toEqual([
        [[10, -20], [30, -20], [40, -10], [10, -20]]
      ]);
    });

    test('supports removeLastPoint while drawing', () => {

      draw.removeLastPoint();

      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 40, 30);
      simulateEvent('pointerdown', 40, 30);
      simulateEvent('pointerup', 40, 30);

      simulateEvent('pointermove', 100, 100);
      draw.removeLastPoint();

      // click near the removed point
      simulateEvent('pointermove', 39, 31);
      simulateEvent('pointerdown', 39, 31);
      simulateEvent('pointerup', 39, 31);

      expect(source.getFeatures()).toHaveLength(0);
    });

    test(
      'will tolerate removeLastPoint being called when no coordinates',
      () => {

        // first point
        simulateEvent('pointermove', 10, 20);
        simulateEvent('pointerdown', 10, 20);
        simulateEvent('pointerup', 10, 20);

        // second point
        simulateEvent('pointermove', 40, 30);
        simulateEvent('pointerdown', 40, 30);
        simulateEvent('pointerup', 40, 30);

        simulateEvent('pointermove', 100, 100);

        expect(function() {
          draw.removeLastPoint();
          draw.removeLastPoint();
          draw.removeLastPoint();
        }).not.toThrow();

      }
    );

    test('draws polygon with clicks, finishing on last point', () => {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      // third point
      simulateEvent('pointermove', 40, 10);
      simulateEvent('pointerdown', 40, 10);
      simulateEvent('pointerup', 40, 10);

      // finish on last point
      simulateEvent('pointerdown', 40, 10);
      simulateEvent('pointerup', 40, 10);

      const features = source.getFeatures();
      expect(features).toHaveLength(1);
      const geometry = features[0].getGeometry();
      expect(geometry).toBeInstanceOf(Polygon);

      expect(geometry.getCoordinates()).toEqual([
        [[10, -20], [30, -20], [40, -10], [10, -20]]
      ]);
    });

    test('supports freehand drawing for polygons', () => {
      // freehand sequence
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20, true);
      simulateEvent('pointermove', 30, 20, true);
      simulateEvent('pointerdrag', 30, 20, true);
      simulateEvent('pointermove', 40, 10, true);
      simulateEvent('pointerdrag', 40, 10, true);
      simulateEvent('pointerup', 40, 10, true);

      // finish on last point
      simulateEvent('pointerdown', 40, 10);
      simulateEvent('pointerup', 40, 10);

      const features = source.getFeatures();
      expect(features).toHaveLength(1);
      const geometry = features[0].getGeometry();
      expect(geometry).toBeInstanceOf(Polygon);

      expect(geometry.getCoordinates()).toEqual([
        [[10, -20], [30, -20], [40, -10], [10, -20]]
      ]);
    });

    test('triggers draw events', () => {
      const ds = sinon.spy();
      const de = sinon.spy();
      listen(draw, 'drawstart', ds);
      listen(draw, 'drawend', de);

      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      // third point
      simulateEvent('pointermove', 30, 10);
      simulateEvent('pointerdown', 30, 10);
      simulateEvent('pointerup', 30, 10);

      // finish on first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      expect(ds).to.be.called();
      expect(ds.callCount).toBe(1);
      expect(de).to.be.called();
      expect(de.callCount).toBe(1);
    });

    test(
      'works if finishDrawing is called when the sketch feature is not defined',
      () => {
        expect(function() {
          draw.finishDrawing();
        }).not.toThrow();
      }
    );

  });

  describe('drawing multi-polygons', () => {
    let draw;

    beforeEach(() => {
      draw = new Draw({
        source: source,
        type: 'MultiPolygon'
      });
      map.addInteraction(draw);
    });

    test('draws multi with clicks, finishing on first point', () => {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      // third point
      simulateEvent('pointermove', 40, 10);
      simulateEvent('pointerdown', 40, 10);
      simulateEvent('pointerup', 40, 10);

      // finish on first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      const features = source.getFeatures();
      expect(features).toHaveLength(1);
      const geometry = features[0].getGeometry();
      expect(geometry).toBeInstanceOf(MultiPolygon);
      const coordinates = geometry.getCoordinates();
      expect(coordinates).toHaveLength(1);

      expect(coordinates[0]).toEqual([
        [[10, -20], [30, -20], [40, -10], [10, -20]]
      ]);
    });

    test('draws multi with clicks, finishing on last point', () => {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      // third point
      simulateEvent('pointermove', 40, 10);
      simulateEvent('pointerdown', 40, 10);
      simulateEvent('pointerup', 40, 10);

      // finish on last point
      simulateEvent('pointerdown', 40, 10);
      simulateEvent('pointerup', 40, 10);

      const features = source.getFeatures();
      expect(features).toHaveLength(1);
      const geometry = features[0].getGeometry();
      expect(geometry).toBeInstanceOf(MultiPolygon);
      const coordinates = geometry.getCoordinates();
      expect(coordinates).toHaveLength(1);

      expect(coordinates[0]).toEqual([
        [[10, -20], [30, -20], [40, -10], [10, -20]]
      ]);
    });

    test(
      'works if finishDrawing is called when the sketch feature is not defined',
      () => {
        expect(function() {
          draw.finishDrawing();
        }).not.toThrow();
      }
    );

  });

  describe('drawing circles', () => {
    let draw;

    beforeEach(() => {
      draw = new Draw({
        source: source,
        type: 'Circle'
      });
      map.addInteraction(draw);
    });

    test('draws circle with clicks, finishing on second point', () => {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // finish on second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      const features = source.getFeatures();
      expect(features).toHaveLength(1);
      const geometry = features[0].getGeometry();
      expect(geometry).toBeInstanceOf(Circle);
      expect(geometry.getCenter()).toEqual([10, -20]);
      expect(geometry.getRadius()).toEqual(20);
    });

    test('supports freehand drawing for circles', () => {
      draw.freehand_ = true;
      draw.freehandCondition_ = always;

      // no feature created when not moved
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);
      expect(source.getFeatures()).toHaveLength(0);

      // feature created when moved
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerup', 30, 20);
      expect(source.getFeatures()).toHaveLength(1);
    });

    test('triggers draw events', () => {
      const ds = sinon.spy();
      const de = sinon.spy();
      listen(draw, 'drawstart', ds);
      listen(draw, 'drawend', de);

      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // finish on second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      expect(ds).to.be.called();
      expect(ds.callCount).toBe(1);
      expect(de).to.be.called();
      expect(de.callCount).toBe(1);
    });

    test(
      'works if finishDrawing is called when the sketch feature is not defined',
      () => {
        expect(function() {
          draw.finishDrawing();
        }).not.toThrow();
      }
    );

  });

  describe('#setActive()', () => {
    let interaction;

    beforeEach(() => {
      interaction = new Draw({
        type: 'LineString'
      });

      expect(interaction.getActive()).toBe(true);

      map.addInteraction(interaction);

      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      expect(interaction.sketchFeature_).not.toBe(null);
    });

    afterEach(() => {
      map.removeInteraction(interaction);
    });

    describe('#setActive(false)', () => {
      test('unsets the map from the feature overlay', () => {
        const spy = sinon.spy(interaction.overlay_, 'setMap');
        interaction.setActive(false);
        expect(spy.getCall(0).args[0]).toBe(null);
      });
      test('aborts the drawing', () => {
        interaction.setActive(false);
        expect(interaction.sketchFeature_).toBe(null);
      });
      test('fires change:active', () => {
        const spy = sinon.spy(interaction.overlay_, 'setMap');
        const listenerSpy = sinon.spy(function() {
          expect(spy.getCall(0).args[0]).toBe(null);
        });
        interaction.on('change:active', listenerSpy);
        interaction.setActive(false);
        expect(listenerSpy.callCount).toBe(1);
      });
    });

    describe('#setActive(true)', () => {
      beforeEach(() => {
        interaction.setActive(false);
      });
      test('sets the map into the feature overlay', () => {
        const spy = sinon.spy(interaction.overlay_, 'setMap');
        interaction.setActive(true);
        expect(spy.getCall(0).args[0]).toBe(map);
      });
      test('fires change:active', () => {
        const spy = sinon.spy(interaction.overlay_, 'setMap');
        const listenerSpy = sinon.spy(function() {
          expect(spy.getCall(0).args[0]).toBe(map);
        });
        interaction.on('change:active', listenerSpy);
        interaction.setActive(true);
        expect(listenerSpy.callCount).toBe(1);
      });
    });

  });

  describe('#setMap()', () => {
    let interaction;

    beforeEach(() => {
      interaction = new Draw({
        type: 'LineString'
      });
      expect(interaction.getActive()).toBe(true);
    });

    describe('#setMap(null)', () => {
      beforeEach(() => {
        map.addInteraction(interaction);
        // first point
        simulateEvent('pointermove', 10, 20);
        simulateEvent('pointerdown', 10, 20);
        simulateEvent('pointerup', 10, 20);
        expect(interaction.sketchFeature_).not.toBe(null);
      });
      afterEach(() => {
        map.removeInteraction(interaction);
      });
      describe('#setMap(null) when interaction is active', () => {
        test('unsets the map from the feature overlay', () => {
          const spy = sinon.spy(interaction.overlay_, 'setMap');
          interaction.setMap(null);
          expect(spy.getCall(0).args[0]).toBe(null);
        });
        test('aborts the drawing', () => {
          interaction.setMap(null);
          expect(interaction.sketchFeature_).toBe(null);
        });
      });
    });

    describe('#setMap(map)', () => {
      describe('#setMap(map) when interaction is active', () => {
        test('sets the map into the feature overlay', () => {
          const spy = sinon.spy(interaction.overlay_, 'setMap');
          interaction.setMap(map);
          expect(spy.getCall(0).args[0]).toBe(map);
        });
      });
      describe('#setMap(map) when interaction is not active', () => {
        test('does not set the map into the feature overlay', () => {
          interaction.setActive(false);
          const spy = sinon.spy(interaction.overlay_, 'setMap');
          interaction.setMap(map);
          expect(spy.getCall(0).args[0]).toBe(null);
        });
      });

    });
  });

  describe('#getOverlay', () => {
    test('returns the feature overlay layer', () => {
      const draw = new Draw({});
      expect (draw.getOverlay()).toEqual(draw.overlay_);
    });
  });

  describe('createRegularPolygon', () => {
    test('creates a regular polygon in Circle mode', () => {
      const draw = new Draw({
        source: source,
        type: 'Circle',
        geometryFunction: createRegularPolygon(4, Math.PI / 4)
      });
      map.addInteraction(draw);

      // first point
      simulateEvent('pointermove', 0, 0);
      simulateEvent('pointerdown', 0, 0);
      simulateEvent('pointerup', 0, 0);

      // finish on second point
      simulateEvent('pointermove', 20, 20);
      simulateEvent('pointerdown', 20, 20);
      simulateEvent('pointerup', 20, 20);

      const features = source.getFeatures();
      const geometry = features[0].getGeometry();
      expect(geometry).toBeInstanceOf(Polygon);
      const coordinates = geometry.getCoordinates();
      expect(coordinates[0].length).toEqual(5);
      expect(coordinates[0][0][0]).to.roughlyEqual(20, 1e-9);
      expect(coordinates[0][0][1]).to.roughlyEqual(20, 1e-9);
    });

    test('sketch start point always matches the mouse point', () => {
      const draw = new Draw({
        source: source,
        type: 'Circle',
        geometryFunction: createRegularPolygon(3)
      });
      map.addInteraction(draw);

      // regular polygon center point
      simulateEvent('pointermove', 60, 60);
      simulateEvent('pointerdown', 60, 60);
      simulateEvent('pointerup', 60, 60);

      // move to first quadrant
      simulateEvent('pointermove', 79, 80);
      let event = simulateEvent('pointermove', 80, 80);
      let coordinate = event.coordinate;
      const firstQuadrantCoordinate = draw.sketchFeature_.getGeometry().getFirstCoordinate();
      expect(firstQuadrantCoordinate[0]).to.roughlyEqual(coordinate[0], 1e-9);
      expect(firstQuadrantCoordinate[1]).to.roughlyEqual(coordinate[1], 1e-9);

      // move to second quadrant
      simulateEvent('pointermove', 41, 80);
      event = simulateEvent('pointermove', 40, 80);
      coordinate = event.coordinate;
      const secondQuadrantCoordinate = draw.sketchFeature_.getGeometry().getFirstCoordinate();
      expect(secondQuadrantCoordinate[0]).to.roughlyEqual(coordinate[0], 1e-9);
      expect(secondQuadrantCoordinate[1]).to.roughlyEqual(coordinate[1], 1e-9);

      // move to third quadrant
      simulateEvent('pointermove', 40, 41);
      event = simulateEvent('pointermove', 40, 40);
      coordinate = event.coordinate;
      const thirdQuadrantCoordinate = draw.sketchFeature_.getGeometry().getFirstCoordinate();
      expect(thirdQuadrantCoordinate[0]).to.roughlyEqual(coordinate[0], 1e-9);
      expect(thirdQuadrantCoordinate[1]).to.roughlyEqual(coordinate[1], 1e-9);

      // move to fourth quadrant
      simulateEvent('pointermove', 79, 40);
      event = simulateEvent('pointermove', 80, 40);
      coordinate = event.coordinate;
      const fourthQuadrantCoordinate = draw.sketchFeature_.getGeometry().getFirstCoordinate();
      expect(fourthQuadrantCoordinate[0]).to.roughlyEqual(coordinate[0], 1e-9);
      expect(fourthQuadrantCoordinate[1]).to.roughlyEqual(coordinate[1], 1e-9);
    });
  });

  describe('createBox', () => {
    test('creates a box-shaped polygon in Circle mode', () => {
      const draw = new Draw({
        source: source,
        type: 'Circle',
        geometryFunction: createBox()
      });
      map.addInteraction(draw);

      // first point
      simulateEvent('pointermove', 0, 0);
      simulateEvent('pointerdown', 0, 0);
      simulateEvent('pointerup', 0, 0);

      // finish on second point
      simulateEvent('pointermove', 20, 20);
      simulateEvent('pointerdown', 20, 20);
      simulateEvent('pointerup', 20, 20);

      const features = source.getFeatures();
      const geometry = features[0].getGeometry();
      expect(geometry).toBeInstanceOf(Polygon);
      const coordinates = geometry.getCoordinates();
      expect(coordinates[0]).toHaveLength(5);
      expect(geometry.getArea()).toBe(400);
      expect(geometry.getExtent()).toEqual([0, -20, 20, 0]);
    });
  });

  describe('extend an existing feature', () => {
    let draw;
    let feature;

    beforeEach(() => {
      draw = new Draw({
        source: source,
        type: 'LineString'
      });
      map.addInteraction(draw);
      feature = new Feature(
        new LineString([[0, 0], [1, 1], [2, 0]]));
    });

    test('sets the initial state', () => {
      draw.extend(feature);
      expect(draw.sketchCoords_).toHaveLength(4);
      expect(draw.sketchCoords_).toEqual([[0, 0], [1, 1], [2, 0], [2, 0]]);
      expect(draw.finishCoordinate_).toEqual([2, 0]);
    });

    test('dispatches a drawstart event', () => {
      const spy = sinon.spy();
      listen(draw, 'drawstart', spy);
      draw.extend(feature);
      expect(spy.callCount).toBe(1);
    });

  });
});
