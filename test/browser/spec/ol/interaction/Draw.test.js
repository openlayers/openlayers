import {assert} from 'chai';
import proj4 from 'proj4';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../../src/ol/MapBrowserEvent.js';
import {unByKey} from '../../../../../src/ol/Observable.js';
import View from '../../../../../src/ol/View.js';
import {equals} from '../../../../../src/ol/array.js';
import {listen} from '../../../../../src/ol/events.js';
import {
  altKeyOnly,
  always,
  shiftKeyOnly,
} from '../../../../../src/ol/events/condition.js';
import Circle from '../../../../../src/ol/geom/Circle.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import Draw, {
  createBox,
  createRegularPolygon,
} from '../../../../../src/ol/interaction/Draw.js';
import Interaction from '../../../../../src/ol/interaction/Interaction.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import {
  clearUserProjection,
  setUserProjection,
  transform,
} from '../../../../../src/ol/proj.js';
import {register} from '../../../../../src/ol/proj/proj4.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';

describe('ol/interaction/Draw', function () {
  /**
   * @type {VectorSource}
   */
  let source;

  /**
   * @type {Map}
   */
  let map;

  /**
   * @type {HTMLDivElement}
   */
  let target;

  const width = 360;
  const height = 180;

  beforeEach(
    () =>
      new Promise((resolve) => {
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
            resolution: 1,
          }),
        });
        map.once('postrender', function () {
          resolve();
        });
      }),
  );

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
   * @param {boolean} [opt_shiftKey] Shift key is pressed.
   * @param {boolean} [opt_pointerId] Pointer id.
   * @return {module:ol/MapBrowserEvent} The simulated event.
   */
  function simulateEvent(type, x, y, opt_shiftKey, opt_pointerId = 0) {
    const viewport = map.getViewport();
    // calculated in case body has top < 0 (test runner with small window)
    const position = viewport.getBoundingClientRect();
    const shiftKey = opt_shiftKey !== undefined ? opt_shiftKey : false;
    const event = {};
    event.type = type;
    event.target = viewport.firstChild;
    event.clientX = position.left + x + width / 2;
    event.clientY = position.top + y + height / 2;
    event.shiftKey = shiftKey;
    event.preventDefault = function () {};
    event.pointerType = 'mouse';
    event.pointerId = opt_pointerId;
    const simulatedEvent = new MapBrowserEvent(type, map, event);
    map.handleMapBrowserEvent(simulatedEvent);
    return simulatedEvent;
  }

  function simulateBrowserEvent(type, x, y) {
    const viewport = map.getViewport();
    // calculated in case body has top < 0 (test runner with small window)
    const position = viewport.getBoundingClientRect();
    const evt = new PointerEvent(type, {
      clientX: position.left + x + width / 2,
      clientY: position.top + y + height / 2,
    });
    (type === 'pointerup' ? document : map.getViewport()).dispatchEvent(evt);
  }

  describe('constructor', function () {
    it('creates a new interaction', function () {
      const draw = new Draw({
        source: source,
        type: 'Point',
      });
      assert.instanceOf(draw, Draw);
      assert.instanceOf(draw, Interaction);
    });

    it('accepts a freehand option', function () {
      const draw = new Draw({
        source: source,
        type: 'LineString',
        freehand: true,
      });

      const event = new PointerEvent('pointerdown', {
        clientX: 0,
        clientY: 0,
        shiftKey: false,
      });

      assert.strictEqual(draw.freehandCondition_(event), true);
    });

    describe('trace option', function () {
      it('always goes in trace mode if true', function () {
        const draw = new Draw({
          source: source,
          type: 'LineString',
          trace: true,
        });

        const event = new MapBrowserEvent({
          map: map,
          type: 'pointerup',
          originalEvent: new PointerEvent('pointerup', {
            clientX: 0,
            clientY: 0,
          }),
        });

        assert.strictEqual(draw.traceCondition_(event), true);
      });

      it('never goes in trace mode if false', function () {
        const draw = new Draw({
          source: source,
          type: 'LineString',
          trace: false,
        });

        const event = new MapBrowserEvent(
          map,
          'pointerup',
          new PointerEvent('pointerup', {
            clientX: 0,
            clientY: 0,
          }),
        );

        assert.strictEqual(draw.traceCondition_(event), false);
      });

      it('accepts a condition', function () {
        const draw = new Draw({
          source: source,
          type: 'LineString',
          trace: shiftKeyOnly,
        });

        const goodEvent = new MapBrowserEvent(
          map,
          'pointerup',
          new PointerEvent('pointerup', {
            clientX: 0,
            clientY: 0,
            shiftKey: true,
          }),
        );

        assert.strictEqual(draw.traceCondition_(goodEvent), true);

        const badEvent = new MapBrowserEvent(
          map,
          'pointerup',
          new PointerEvent('pointerup', {
            clientX: 0,
            clientY: 0,
            shiftKey: false,
          }),
        );

        assert.strictEqual(draw.traceCondition_(badEvent), false);
      });
    });

    it('accepts a dragVertexDelay option', function () {
      const draw = new Draw({
        source: source,
        type: 'LineString',
        dragVertexDelay: 42,
      });
      assert.strictEqual(draw.dragVertexDelay_, 42);
    });

    it('accepts a stopClick option', function () {
      const draw = new Draw({
        source: source,
        type: 'Point',
        stopClick: true,
      });
      map.addInteraction(draw);
      let clicked = false;
      const clickKey = map.on('click', () => (clicked = true));
      simulateBrowserEvent('pointermove', 10, 20);
      simulateBrowserEvent('pointerdown', 10, 20);
      simulateBrowserEvent('pointerup', 10, 20);
      assert.strictEqual(clicked, false);
      unByKey(clickKey);
      //}, 300);
    });

    it('accepts a geometryLayout option', function () {
      const draw = new Draw({
        source: source,
        type: 'Point',
        geometryLayout: 'XYZ',
      });
      assert.strictEqual(draw.geometryLayout_, 'XYZ');
    });
  });

  describe('specifying a geometryName', function () {
    beforeEach(function () {
      const draw = new Draw({
        source: source,
        geometryName: 'the_geom',
        type: 'Point',
      });
      map.addInteraction(draw);
    });

    it('creates a feature with the correct geometryName', function () {
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);
      const features = source.getFeatures();
      const geometry = features[0].getGeometry();
      assert.equal(features[0].getGeometryName(), 'the_geom');
      assert.instanceOf(geometry, Point);
    });
  });

  describe('specifying a clickTolerance', function () {
    beforeEach(function () {
      const draw = new Draw({
        source: source,
        type: 'Point',
        clickTolerance: 6,
      });
      map.addInteraction(draw);
    });

    it('adds a point when below the tolerance', function () {
      let features;

      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 15, 25);
      features = source.getFeatures();
      assert.lengthOf(features, 0);

      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 14, 24);
      features = source.getFeatures();
      assert.lengthOf(features, 1);
    });
  });

  describe('drawing points', function () {
    let draw;

    beforeEach(function () {
      draw = new Draw({
        source: source,
        type: 'Point',
      });
      map.addInteraction(draw);
    });

    it('draws a point on click', function () {
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);
      const features = source.getFeatures();
      assert.lengthOf(features, 1);
      const geometry = features[0].getGeometry();
      assert.instanceOf(geometry, Point);
      assert.deepEqual(geometry.getCoordinates(), [10, -20]);
    });

    it('does not draw a point with a significant drag', function () {
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointermove', 18, 20);
      simulateEvent('pointerup', 18, 20);
      const features = source.getFeatures();
      assert.lengthOf(features, 0);
    });

    it('does not draw a point when modifier key is pressed', function () {
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20, true);
      simulateEvent('pointerup', 10, 20);
      const features = source.getFeatures();
      assert.lengthOf(features, 0);
    });

    it('does not draw a point when multiple pointers are involved', function () {
      simulateEvent('pointerdown', 10, 20, false, 1);
      simulateEvent('pointerdown', 10, 20, false, 2);
      simulateEvent('pointermove', 10, 30, false, 1);
      simulateEvent('pointermove', 10, 10, false, 2);
      simulateEvent('pointerup', 10, 30, false, 1);
      simulateEvent('pointerup', 10, 10, false, 2);
      const features = source.getFeatures();
      assert.lengthOf(features, 0);
    });

    it('triggers draw events', function () {
      const ds = vi.fn();
      const de = vi.fn();
      const da = vi.fn();
      listen(draw, 'drawstart', ds);
      listen(draw, 'drawend', de);
      listen(draw, 'drawabort', da);
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);
      assert.isAbove(ds.mock.calls.length, 0);
      assert.isAbove(de.mock.calls.length, 0);
      assert.strictEqual(da.mock.calls.length, 0);
      simulateEvent('pointermove', 20, 20);
      assert.strictEqual(ds.mock.calls.length, 1);
      assert.strictEqual(de.mock.calls.length, 1);
      assert.strictEqual(da.mock.calls.length, 0);
    });

    it('triggers drawend event before inserting the feature', function () {
      const receivedEvents = {
        end: 0,
        addfeature: 0,
      };
      listen(draw, 'drawend', function () {
        assert.strictEqual(receivedEvents.end, 0);
        assert.strictEqual(receivedEvents.addfeature, 0);
        ++receivedEvents.end;
      });
      source.on('addfeature', function () {
        assert.strictEqual(receivedEvents.end, 1);
        assert.strictEqual(receivedEvents.addfeature, 0);
        receivedEvents.addfeature++;
      });
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);
      simulateEvent('pointermove', 20, 20);
      assert.strictEqual(receivedEvents.end, 1);
      assert.strictEqual(receivedEvents.addfeature, 1);
    });

    it('works if finishDrawing is called when the sketch feature is not defined', function () {
      assert.doesNotThrow(function () {
        draw.finishDrawing();
      });
    });
  });

  describe('drawing multipoints', function () {
    let draw;

    beforeEach(function () {
      draw = new Draw({
        source: source,
        type: 'MultiPoint',
      });
      map.addInteraction(draw);
    });

    it('draws multipoint on click', function () {
      simulateEvent('pointermove', 30, 15);
      simulateEvent('pointerdown', 30, 15);
      simulateEvent('pointerup', 30, 15);
      const features = source.getFeatures();
      assert.lengthOf(features, 1);
      const geometry = features[0].getGeometry();
      assert.instanceOf(geometry, MultiPoint);
      assert.deepEqual(geometry.getCoordinates(), [[30, -15]]);
    });

    it('works if finishDrawing is called when the sketch feature is not defined', function () {
      assert.doesNotThrow(function () {
        draw.finishDrawing();
      });
    });
  });

  describe('drawing linestrings', function () {
    let draw;

    beforeEach(function () {
      draw = new Draw({
        source: source,
        type: 'LineString',
      });
      map.addInteraction(draw);
    });

    it('draws linestring with clicks, finishing on last point', function () {
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
      assert.lengthOf(features, 1);
      const geometry = features[0].getGeometry();
      assert.instanceOf(geometry, LineString);
      assert.deepEqual(geometry.getCoordinates(), [
        [10, -20],
        [30, -20],
      ]);
    });

    it('supports removeLastPoint while drawing', function () {
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

      assert.lengthOf(source.getFeatures(), 0);
    });

    it('supports freehand drawing for linestrings', function () {
      // freehand sequence
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20, true);
      simulateEvent('pointermove', 20, 30, true);
      simulateEvent('pointerdrag', 20, 30, true);
      simulateEvent('pointermove', 20, 40, true);
      simulateEvent('pointerdrag', 20, 40, true);
      simulateEvent('pointerup', 20, 40, true);

      const features = source.getFeatures();
      assert.lengthOf(features, 1);
      const geometry = features[0].getGeometry();
      assert.instanceOf(geometry, LineString);
      assert.deepEqual(geometry.getCoordinates(), [
        [10, -20],
        [20, -30],
        [20, -40],
      ]);
    });

    it('allows freehand mode for part of the drawing', function () {
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
      const geometry = features[0].getGeometry();
      assert.instanceOf(geometry, LineString);
      assert.deepEqual(geometry.getCoordinates(), [
        [10, -20],
        [20, -30],
        [30, -40],
        [40, -50],
        [50, -60],
        [60, -70],
      ]);
    });

    it('does not add a point with a significant drag', function () {
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
      assert.lengthOf(features, 1);
      const geometry = features[0].getGeometry();
      assert.instanceOf(geometry, LineString);
      assert.deepEqual(geometry.getCoordinates(), [
        [10, -20],
        [30, -20],
      ]);
    });

    it('allows dragging of the vertex after dragVertexDelay', () =>
      new Promise((resolve) => {
        // first point
        simulateEvent('pointermove', 10, 20);
        simulateEvent('pointerdown', 10, 20);
        simulateEvent('pointerup', 10, 20);

        // second point, drag vertex
        simulateEvent('pointermove', 15, 20);
        simulateEvent('pointerdown', 15, 20);
        setTimeout(function () {
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
          assert.lengthOf(features, 1);
          const geometry = features[0].getGeometry();
          assert.instanceOf(geometry, LineString);
          assert.deepEqual(geometry.getCoordinates(), [
            [10, -20],
            [20, -10],
            [30, -20],
          ]);

          resolve();
        }, 600);
      }));

    it('triggers draw events', function () {
      const ds = vi.fn();
      const de = vi.fn();
      const da = vi.fn();
      listen(draw, 'drawstart', ds);
      listen(draw, 'drawend', de);
      listen(draw, 'drawabort', da);

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

      assert.isAbove(ds.mock.calls.length, 0);
      assert.strictEqual(ds.mock.calls.length, 1);
      assert.isAbove(de.mock.calls.length, 0);
      assert.strictEqual(de.mock.calls.length, 1);
      assert.strictEqual(da.mock.calls.length, 0);
      assert.strictEqual(da.mock.calls.length, 0);
    });

    it('works if finishDrawing is called when the sketch feature is not defined', function () {
      assert.doesNotThrow(function () {
        draw.finishDrawing();
      });
    });
  });

  describe('drawing with a condition', function () {
    let draw;
    beforeEach(function () {
      draw = new Draw({
        source: source,
        type: 'LineString',
        condition: shiftKeyOnly,
        freehandCondition: altKeyOnly,
      });
      map.addInteraction(draw);
    });

    it('finishes draw sequence correctly', function () {
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
      assert.lengthOf(features, 1);
      const geometry = features[0].getGeometry();
      assert.instanceOf(geometry, LineString);
      assert.deepEqual(geometry.getCoordinates(), [
        [10, -20],
        [30, -20],
      ]);

      // without modifier, to be handled by the map's DragPan interaction
      simulateEvent('pointermove', 20, 20);
      simulateEvent('pointerdown', 20, 20);
      simulateEvent('pointermove', 10, 30);
      assert.strictEqual(draw.lastDragTime_, undefined);
    });
  });

  describe('finishCondition called for each type', function () {
    let draw;
    function createDrawInteraction(type, finishCondition) {
      draw = new Draw({
        source: source,
        type: type,
        finishCondition: finishCondition,
      });
      draw.atFinish_ = vi.fn(Draw.prototype.atFinish_);
      draw.finishDrawing = vi.fn(Draw.prototype.finishDrawing);
      map.addInteraction(draw);
    }

    const testCoordinates = [
      [0, 0],
      [10, 0],
      [10, 10],
    ];

    function drawType(type, amount, finishCondition) {
      createDrawInteraction(type, finishCondition);

      for (let i = 0; i < amount; ++i) {
        const [x, y] = testCoordinates[i];
        simulateEvent('pointermove', x, y);
        simulateEvent('pointerdown', x, y);
        simulateEvent('pointerup', x, y);
      }
      if (amount > 1 && type !== 'Circle') {
        const [x, y] = testCoordinates[amount - 1];
        simulateEvent('pointerdown', x, y);
        simulateEvent('pointerup', x, y);
      }
    }

    function testFinishConditionTrue(type, amount) {
      const finishCondition = vi.fn(() => true);
      drawType(type, amount, finishCondition);
      assert.isAbove(draw.atFinish_.mock.calls.length, 0);
      assert.strictEqual(finishCondition.mock.calls.length, 1);
      assert.strictEqual(draw.finishDrawing.mock.calls.length, 1);
      assert.lengthOf(source.getFeatures(), 1);
    }
    it('calls finishCondition:true for POINT type', function () {
      testFinishConditionTrue('Point', 1);
    });
    it('calls finishCondition:true for MULTI_POINT type', function () {
      testFinishConditionTrue('MultiPoint', 1);
    });
    it('calls finishCondition:true for LINE_STRING type', function () {
      testFinishConditionTrue('LineString', 2);
    });
    it('calls finishCondition:true for MULTI_LINE_STRING type', function () {
      testFinishConditionTrue('MultiLineString', 2);
    });
    it('calls finishCondition:true for CIRCLE type', function () {
      testFinishConditionTrue('Circle', 2);
    });
    it('calls finishCondition:true for POLYGON type', function () {
      testFinishConditionTrue('Polygon', 3);
    });
    it('calls finishCondition:true for MULTI_POLYGON type', function () {
      testFinishConditionTrue('MultiPolygon', 3);
    });

    function testFinishConditionFalse(type, amount) {
      const finishCondition = vi.fn(() => false);
      drawType(type, amount, finishCondition);
      assert.isAbove(draw.atFinish_.mock.calls.length, 0);
      assert.strictEqual(finishCondition.mock.calls.length, 1);
      assert.strictEqual(draw.finishDrawing.mock.calls.length, 0);
      assert.lengthOf(source.getFeatures(), 0);
    }
    it('calls finishCondition:false for POINT type', function () {
      testFinishConditionFalse('Point', 1);
    });
    it('calls finishCondition:false for MULTI_POINT type', function () {
      testFinishConditionFalse('MultiPoint', 1);
    });
    it('calls finishCondition:false for LINE_STRING type', function () {
      testFinishConditionFalse('LineString', 2);
    });
    it('calls finishCondition:false for MULTI_LINE_STRING type', function () {
      testFinishConditionFalse('MultiLineString', 2);
    });
    it('calls finishCondition:false for CIRCLE type', function () {
      testFinishConditionFalse('Circle', 2);
    });
    it('calls finishCondition:false for POLYGON type', function () {
      testFinishConditionFalse('Polygon', 3);
    });
    it('calls finishCondition:false for MULTI_POLYGON type', function () {
      testFinishConditionFalse('MultiPolygon', 3);
    });
  });

  describe('drawing with a finishCondition', function () {
    beforeEach(function () {
      const draw = new Draw({
        source: source,
        type: 'LineString',
        finishCondition: function (event) {
          return equals(event.coordinate, [30, -20]);
        },
      });
      map.addInteraction(draw);
    });

    it('draws a linestring failing to finish it first, then finishes it', function () {
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
      assert.lengthOf(features, 0);

      // third point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      //  finish on this point
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      features = source.getFeatures();
      assert.lengthOf(features, 1);
    });
  });

  describe('drawing multi-linestrings', function () {
    let draw;

    beforeEach(function () {
      draw = new Draw({
        source: source,
        type: 'MultiLineString',
      });
      map.addInteraction(draw);
    });

    it('draws multi with clicks, finishing on last point', function () {
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
      assert.lengthOf(features, 1);
      const geometry = features[0].getGeometry();
      assert.instanceOf(geometry, MultiLineString);
      assert.deepEqual(geometry.getCoordinates(), [
        [
          [10, -20],
          [30, -20],
        ],
      ]);
    });

    it('works if finishDrawing is called when the sketch feature is not defined', function () {
      assert.doesNotThrow(function () {
        draw.finishDrawing();
      });
    });
  });

  describe('drawing polygons', function () {
    let draw;

    beforeEach(function () {
      draw = new Draw({
        source: source,
        type: 'Polygon',
      });
      map.addInteraction(draw);
    });

    function isClosed(polygon) {
      const first = polygon.getFirstCoordinate();
      const last = polygon.getLastCoordinate();
      assert.deepEqual(first, last);
    }

    it('draws polygon with clicks, finishing on first point', function () {
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
      assert.lengthOf(features, 1);
      const geometry = features[0].getGeometry();
      assert.instanceOf(geometry, Polygon);

      assert.deepEqual(geometry.getCoordinates(), [
        [
          [10, -20],
          [30, -20],
          [40, -10],
          [10, -20],
        ],
      ]);
    });

    it('supports removeLastPoint while drawing', function () {
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

      assert.lengthOf(source.getFeatures(), 0);
    });

    it('will tolerate removeLastPoint being called when no coordinates', function () {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 40, 30);
      simulateEvent('pointerdown', 40, 30);
      simulateEvent('pointerup', 40, 30);

      simulateEvent('pointermove', 100, 100);

      assert.doesNotThrow(function () {
        draw.removeLastPoint();
        draw.removeLastPoint();
        draw.removeLastPoint();
      });
    });

    it('draws polygon with clicks, finishing on last point', function () {
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
      assert.lengthOf(features, 1);
      const geometry = features[0].getGeometry();
      assert.instanceOf(geometry, Polygon);

      assert.deepEqual(geometry.getCoordinates(), [
        [
          [10, -20],
          [30, -20],
          [40, -10],
          [10, -20],
        ],
      ]);
    });

    it('supports freehand drawing for polygons', function () {
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
      assert.lengthOf(features, 1);
      const geometry = features[0].getGeometry();
      assert.instanceOf(geometry, Polygon);

      assert.deepEqual(geometry.getCoordinates(), [
        [
          [10, -20],
          [30, -20],
          [40, -10],
          [10, -20],
        ],
      ]);
    });

    it('triggers draw events', function () {
      const ds = vi.fn();
      const de = vi.fn();
      const da = vi.fn();
      listen(draw, 'drawstart', ds);
      listen(draw, 'drawend', de);
      listen(draw, 'drawabort', da);

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

      assert.isAbove(ds.mock.calls.length, 0);
      assert.strictEqual(ds.mock.calls.length, 1);
      assert.isAbove(de.mock.calls.length, 0);
      assert.strictEqual(de.mock.calls.length, 1);
      assert.strictEqual(da.mock.calls.length, 0);
      assert.strictEqual(da.mock.calls.length, 0);
    });

    it('works if finishDrawing is called when the sketch feature is not defined', function () {
      assert.doesNotThrow(function () {
        draw.finishDrawing();
      });
    });
  });

  describe('tracing polygons', function () {
    let draw;

    beforeEach(function () {
      draw = new Draw({
        source: source,
        type: 'Polygon',
        trace: true,
      });
      map.addInteraction(draw);
    });

    it('starts tracing with first edge click, stops tracing with second edge click', function () {
      source.addFeatures([
        new Feature(
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
      ]);

      // first click adds a point
      simulateEvent('pointermove', 50, 0);
      simulateEvent('pointerdown', 50, 0);
      simulateEvent('pointerup', 50, 0);
      assert.strictEqual(draw.traceState_.active, false);
      draw.shouldHandle_ = false;

      // second click activates tracing (center of bottom edge)
      simulateEvent('pointermove', 50, 50);
      simulateEvent('pointerdown', 50, 50);
      simulateEvent('pointerup', 50, 50);
      assert.strictEqual(draw.traceState_.active, true);
      assert.strictEqual(draw.traceState_.targetIndex, -1);
      draw.shouldHandle_ = false;

      // move to pick a target
      simulateEvent('pointermove', 75, 10);
      assert.strictEqual(draw.traceState_.active, true);
      assert.strictEqual(draw.traceState_.targetIndex, 0);
      draw.shouldHandle_ = false;

      // third click ends tracing (right half of top edge)
      simulateEvent('pointermove', 75, 100);
      simulateEvent('pointerdown', 75, 100);
      simulateEvent('pointerup', 75, 100);
      assert.strictEqual(draw.traceState_.active, false);
      draw.shouldHandle_ = false;

      // finish on first point
      simulateEvent('pointermove', 50, 0);
      simulateEvent('pointerdown', 50, 0);
      simulateEvent('pointerup', 50, 0);

      const features = source.getFeatures();
      assert.lengthOf(features, 2);
      const geometry = features[1].getGeometry();
      assert.instanceOf(geometry, Polygon);

      assert.deepEqual(geometry.getCoordinates(), [
        [
          [50, 0],
          [50, -50],
          [100, -50], // traced point
          [100, -100], // traced point
          [75, -100],
          [50, 0],
        ],
      ]);
    });
  });

  describe('drawing multi-polygons', function () {
    let draw;

    beforeEach(function () {
      draw = new Draw({
        source: source,
        type: 'MultiPolygon',
      });
      map.addInteraction(draw);
    });

    it('draws multi with clicks, finishing on first point', function () {
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
      assert.lengthOf(features, 1);
      const geometry = features[0].getGeometry();
      assert.instanceOf(geometry, MultiPolygon);
      const coordinates = geometry.getCoordinates();
      assert.lengthOf(coordinates, 1);

      assert.deepEqual(coordinates[0], [
        [
          [10, -20],
          [30, -20],
          [40, -10],
          [10, -20],
        ],
      ]);
    });

    it('draws multi with clicks, finishing on last point', function () {
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
      assert.lengthOf(features, 1);
      const geometry = features[0].getGeometry();
      assert.instanceOf(geometry, MultiPolygon);
      const coordinates = geometry.getCoordinates();
      assert.lengthOf(coordinates, 1);

      assert.deepEqual(coordinates[0], [
        [
          [10, -20],
          [30, -20],
          [40, -10],
          [10, -20],
        ],
      ]);
    });

    it('works if finishDrawing is called when the sketch feature is not defined', function () {
      assert.doesNotThrow(function () {
        draw.finishDrawing();
      });
    });
  });

  describe('drawing circles', function () {
    let draw;

    beforeEach(function () {
      draw = new Draw({
        source: source,
        type: 'Circle',
      });
      map.addInteraction(draw);
    });

    it('draws circle with clicks, finishing on second point along x axis', function () {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // finish on second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      const features = source.getFeatures();
      assert.lengthOf(features, 1);
      const geometry = features[0].getGeometry();
      assert.instanceOf(geometry, Circle);
      assert.deepEqual(geometry.getCenter(), [10, -20]);
      assert.deepEqual(geometry.getRadius(), 20);
    });

    it('draws circle with clicks, finishing on second point along y axis', function () {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // finish on second point
      simulateEvent('pointermove', 10, 40);
      simulateEvent('pointerdown', 10, 40);
      simulateEvent('pointerup', 10, 40);

      const features = source.getFeatures();
      assert.lengthOf(features, 1);
      const geometry = features[0].getGeometry();
      assert.instanceOf(geometry, Circle);
      assert.deepEqual(geometry.getCenter(), [10, -20]);
      assert.deepEqual(geometry.getRadius(), 20);
    });

    it('draws circle with clicks in a user projection, finishing on second point along x axis', function () {
      const userProjection = 'EPSG:3857';
      setUserProjection(userProjection);

      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // finish on second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      const features = source.getFeatures();
      assert.lengthOf(features, 1);
      const geometry = features[0].getGeometry();
      assert.instanceOf(geometry, Circle);
      const viewProjection = map.getView().getProjection();
      assert.deepEqual(
        geometry.getCenter(),
        transform([10, -20], viewProjection, userProjection),
      );
      const radius = geometry
        .clone()
        .transform(userProjection, viewProjection)
        .getRadius();
      assert.approximately(radius, 20, 1e-9);
    });

    it('draws circle with clicks in a user projection, finishing on second point along y axis', function () {
      const userProjection = 'EPSG:3857';
      setUserProjection(userProjection);

      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // finish on second point
      simulateEvent('pointermove', 10, 40);
      simulateEvent('pointerdown', 10, 40);
      simulateEvent('pointerup', 10, 40);

      const features = source.getFeatures();
      assert.lengthOf(features, 1);
      const geometry = features[0].getGeometry();
      assert.instanceOf(geometry, Circle);
      const viewProjection = map.getView().getProjection();
      assert.deepEqual(
        geometry.getCenter(),
        transform([10, -20], viewProjection, userProjection),
      );
      const radius = geometry
        .clone()
        .transform(userProjection, viewProjection)
        .getRadius();
      assert.approximately(radius, 20, 1e-9);
    });

    it('supports freehand drawing for circles', function () {
      draw.freehand_ = true;
      draw.freehandCondition_ = always;

      // no feature created when not moved
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);
      assert.lengthOf(source.getFeatures(), 0);

      // feature created when moved
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerup', 30, 20);
      assert.lengthOf(source.getFeatures(), 1);
    });

    it('triggers draw events', function () {
      const ds = vi.fn();
      const de = vi.fn();
      const da = vi.fn();
      listen(draw, 'drawstart', ds);
      listen(draw, 'drawend', de);
      listen(draw, 'drawabort', da);

      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // finish on second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      assert.isAbove(ds.mock.calls.length, 0);
      assert.strictEqual(ds.mock.calls.length, 1);
      assert.isAbove(de.mock.calls.length, 0);
      assert.strictEqual(de.mock.calls.length, 1);
      assert.strictEqual(da.mock.calls.length, 0);
      assert.strictEqual(da.mock.calls.length, 0);
    });
  });

  describe('#abortDrawing()', function () {
    let draw;

    beforeEach(function () {
      draw = new Draw({
        source: source,
        type: 'LineString',
      });
      map.addInteraction(draw);
    });

    it('aborts the current drawing', function () {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      draw.abortDrawing();

      assert.lengthOf(source.getFeatures(), 0);
      assert.strictEqual(draw.sketchFeature_, null);
    });

    it('triggers draw events', function () {
      const ds = vi.fn();
      const de = vi.fn();
      const da = vi.fn();
      listen(draw, 'drawstart', ds);
      listen(draw, 'drawend', de);
      listen(draw, 'drawabort', da);

      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      draw.abortDrawing();

      assert.isAbove(ds.mock.calls.length, 0);
      assert.strictEqual(ds.mock.calls.length, 1);
      assert.strictEqual(de.mock.calls.length, 0);
      assert.strictEqual(de.mock.calls.length, 0);
      assert.isAbove(da.mock.calls.length, 0);
      assert.strictEqual(da.mock.calls.length, 1);

      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      draw.removeLastPoint();
      draw.removeLastPoint();
      draw.removeLastPoint();

      assert.isAbove(ds.mock.calls.length, 0);
      assert.strictEqual(ds.mock.calls.length, 2);
      assert.strictEqual(de.mock.calls.length, 0);
      assert.strictEqual(de.mock.calls.length, 0);
      assert.isAbove(da.mock.calls.length, 0);
      assert.strictEqual(da.mock.calls.length, 2);
    });

    it('works if finishDrawing is called when the sketch feature is not defined', function () {
      assert.doesNotThrow(function () {
        draw.finishDrawing();
      });
    });
  });

  describe('#setActive()', function () {
    let interaction;

    beforeEach(function () {
      interaction = new Draw({
        type: 'LineString',
      });

      assert.strictEqual(interaction.getActive(), true);

      map.addInteraction(interaction);

      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      assert.notEqual(interaction.sketchFeature_, null);
    });

    afterEach(function () {
      map.removeInteraction(interaction);
    });

    describe('#setActive(false)', function () {
      it('unsets the map from the feature overlay', function () {
        const spy = vi.spyOn(interaction.overlay_, 'setMap');
        interaction.setActive(false);
        assert.strictEqual(spy.mock.calls[0][0], null);
      });
      it('aborts the drawing', function () {
        interaction.setActive(false);
        assert.strictEqual(interaction.sketchFeature_, null);
      });
      it('fires change:active', function () {
        const spy = vi.spyOn(interaction.overlay_, 'setMap');
        const listenerSpy = vi.fn(function () {
          assert.strictEqual(spy.mock.calls[0][0], null);
        });
        interaction.on('change:active', listenerSpy);
        interaction.setActive(false);
        assert.strictEqual(listenerSpy.mock.calls.length, 1);
      });
    });

    describe('#setActive(true)', function () {
      beforeEach(function () {
        interaction.setActive(false);
      });
      it('sets the map into the feature overlay', function () {
        const spy = vi.spyOn(interaction.overlay_, 'setMap');
        interaction.setActive(true);
        assert.strictEqual(spy.mock.calls[0][0], map);
      });
      it('fires change:active', function () {
        const spy = vi.spyOn(interaction.overlay_, 'setMap');
        const listenerSpy = vi.fn(function () {
          assert.strictEqual(spy.mock.calls[0][0], map);
        });
        interaction.on('change:active', listenerSpy);
        interaction.setActive(true);
        assert.strictEqual(listenerSpy.mock.calls.length, 1);
      });
    });
  });

  describe('#setMap()', function () {
    let interaction;

    beforeEach(function () {
      interaction = new Draw({
        type: 'LineString',
      });
      assert.strictEqual(interaction.getActive(), true);
    });

    describe('#setMap(null)', function () {
      beforeEach(function () {
        map.addInteraction(interaction);
        // first point
        simulateEvent('pointermove', 10, 20);
        simulateEvent('pointerdown', 10, 20);
        simulateEvent('pointerup', 10, 20);
        assert.notEqual(interaction.sketchFeature_, null);
      });
      afterEach(function () {
        map.removeInteraction(interaction);
      });
      describe('#setMap(null) when interaction is active', function () {
        it('unsets the map from the feature overlay', function () {
          const spy = vi.spyOn(interaction.overlay_, 'setMap');
          interaction.setMap(null);
          assert.strictEqual(spy.mock.calls[0][0], null);
        });
        it('aborts the drawing', function () {
          interaction.setMap(null);
          assert.strictEqual(interaction.sketchFeature_, null);
        });
      });
    });

    describe('#setMap(null) when no drawing is in progress', function () {
      beforeEach(function () {
        map.addInteraction(interaction);
        simulateEvent('pointermove', 10, 20);
        assert.strictEqual(interaction.sketchFeature_, null);
        assert.notEqual(interaction.sketchPoint_, null);
      });
      afterEach(function () {
        map.removeInteraction(interaction);
      });
      it('clears the sketch features', function () {
        interaction.setMap(null);
        assert.strictEqual(interaction.sketchFeature_, null);
        assert.strictEqual(interaction.sketchPoint_, null);
        assert.strictEqual(interaction.sketchLine_, null);
      });
    });

    describe('#setMap(map)', function () {
      describe('#setMap(map) when interaction is active', function () {
        it('sets the map into the feature overlay', function () {
          const spy = vi.spyOn(interaction.overlay_, 'setMap');
          interaction.setMap(map);
          assert.strictEqual(spy.mock.calls[0][0], map);
        });
      });
      describe('#setMap(map) when interaction is not active', function () {
        it('does not set the map into the feature overlay', function () {
          interaction.setActive(false);
          const spy = vi.spyOn(interaction.overlay_, 'setMap');
          interaction.setMap(map);
          assert.strictEqual(spy.mock.calls[0][0], null);
        });
      });
    });
  });

  describe('#setFreehand()', function () {
    let interaction;

    beforeEach(function () {
      interaction = new Draw({
        type: 'LineString',
      });

      assert.strictEqual(interaction.getActive(), true);

      map.addInteraction(interaction);

      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      assert.notEqual(interaction.sketchFeature_, null);
    });

    afterEach(function () {
      map.removeInteraction(interaction);
    });

    describe('#setFreehand()', function () {
      it('sets freehand property', function () {
        interaction.setFreehand(true);
        assert.strictEqual(interaction.getFreehand(), true);

        interaction.setFreehand(false);
        assert.strictEqual(interaction.getFreehand(), false);
      });
    });
  });

  describe('#getFreehand()', function () {
    it('returns the freehand mode', function () {
      const draw = new Draw({type: 'LineString'});
      assert.deepEqual(draw.getFreehand(), draw.freehand_);
    });
  });

  describe('#getOverlay', function () {
    it('returns the feature overlay layer', function () {
      const draw = new Draw({type: 'Point'});
      assert.deepEqual(draw.getOverlay(), draw.overlay_);
    });
  });

  describe('createRegularPolygon', function () {
    it('creates a regular polygon in Circle mode', function () {
      const draw = new Draw({
        source: source,
        type: 'Circle',
        geometryFunction: createRegularPolygon(4),
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
      assert.instanceOf(geometry, Polygon);
      const coordinates = geometry.getCoordinates();
      assert.deepEqual(coordinates[0].length, 5);
      assert.approximately(coordinates[0][0][0], 20, 1e-9);
      assert.approximately(coordinates[0][0][1], -20, 1e-9);
    });

    it('creates a regular polygon at specified angle', function () {
      const draw = new Draw({
        source: source,
        type: 'Circle',
        geometryFunction: createRegularPolygon(4, Math.PI / 4),
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
      assert.instanceOf(geometry, Polygon);
      const coordinates = geometry.getCoordinates();
      assert.deepEqual(coordinates[0].length, 5);
      assert.approximately(coordinates[0][0][0], 20, 1e-9);
      assert.approximately(coordinates[0][0][1], 20, 1e-9);
    });

    it('creates a regular polygon at specified 0 angle', function () {
      const draw = new Draw({
        source: source,
        type: 'Circle',
        geometryFunction: createRegularPolygon(4, 0),
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
      assert.instanceOf(geometry, Polygon);
      const coordinates = geometry.getCoordinates();
      assert.deepEqual(coordinates[0].length, 5);
      assert.approximately(coordinates[0][0][0], 28.2842712474619, 1e-9);
      assert.approximately(coordinates[0][0][1], 0, 1e-9);
    });

    it('creates a regular polygon in Circle mode in a user projection', function () {
      const userProjection = 'EPSG:3857';
      setUserProjection(userProjection);

      const draw = new Draw({
        source: source,
        type: 'Circle',
        geometryFunction: createRegularPolygon(4, Math.PI / 4),
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
      assert.instanceOf(geometry, Polygon);
      const coordinates = geometry.getCoordinates();
      assert.deepEqual(coordinates[0].length, 5);
      const viewProjection = map.getView().getProjection();
      const coordinate = transform([20, 20], viewProjection, userProjection);
      assert.approximately(coordinates[0][0][0], coordinate[0], 1e-9);
      assert.approximately(coordinates[0][0][1], coordinate[1], 1e-9);
    });

    it('sketch start point always matches the mouse point', function () {
      const draw = new Draw({
        source: source,
        type: 'Circle',
        geometryFunction: createRegularPolygon(3),
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
      const firstQuadrantCoordinate = draw.sketchFeature_
        .getGeometry()
        .getFirstCoordinate();
      assert.approximately(firstQuadrantCoordinate[0], coordinate[0], 1e-9);
      assert.approximately(firstQuadrantCoordinate[1], coordinate[1], 1e-9);

      // move to second quadrant
      simulateEvent('pointermove', 41, 80);
      event = simulateEvent('pointermove', 40, 80);
      coordinate = event.coordinate;
      const secondQuadrantCoordinate = draw.sketchFeature_
        .getGeometry()
        .getFirstCoordinate();
      assert.approximately(secondQuadrantCoordinate[0], coordinate[0], 1e-9);
      assert.approximately(secondQuadrantCoordinate[1], coordinate[1], 1e-9);

      // move to third quadrant
      simulateEvent('pointermove', 40, 41);
      event = simulateEvent('pointermove', 40, 40);
      coordinate = event.coordinate;
      const thirdQuadrantCoordinate = draw.sketchFeature_
        .getGeometry()
        .getFirstCoordinate();
      assert.approximately(thirdQuadrantCoordinate[0], coordinate[0], 1e-9);
      assert.approximately(thirdQuadrantCoordinate[1], coordinate[1], 1e-9);

      // move to fourth quadrant
      simulateEvent('pointermove', 79, 40);
      event = simulateEvent('pointermove', 80, 40);
      coordinate = event.coordinate;
      const fourthQuadrantCoordinate = draw.sketchFeature_
        .getGeometry()
        .getFirstCoordinate();
      assert.approximately(fourthQuadrantCoordinate[0], coordinate[0], 1e-9);
      assert.approximately(fourthQuadrantCoordinate[1], coordinate[1], 1e-9);
    });
  });

  describe('createBox', function () {
    it('creates a box-shaped polygon in Circle mode', function () {
      const draw = new Draw({
        source: source,
        type: 'Circle',
        geometryFunction: createBox(),
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
      assert.instanceOf(geometry, Polygon);
      const coordinates = geometry.getCoordinates();
      assert.lengthOf(coordinates[0], 5);
      assert.equal(geometry.getArea(), 400);
      assert.deepEqual(geometry.getExtent(), [0, -20, 20, 0]);
    });

    it('creates a box-shaped polygon in Circle mode in a user projection', function () {
      proj4.defs(
        'ESRI:54009',
        '+proj=moll +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
      );
      register(proj4);
      const userProjection = 'ESRI:54009';
      setUserProjection(userProjection);

      const draw = new Draw({
        source: source,
        type: 'Circle',
        geometryFunction: createBox(),
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
      assert.instanceOf(geometry, Polygon);
      const coordinates = geometry.getCoordinates();
      assert.lengthOf(coordinates[0], 5);
      const viewProjection = map.getView().getProjection();
      const area = geometry
        .clone()
        .transform(userProjection, viewProjection)
        .getArea();
      assert.approximately(area, 400, 1e-9);
      const extent = geometry
        .clone()
        .transform(userProjection, viewProjection)
        .getExtent();
      assert.approximately(extent[0], 0, 1e-9);
      assert.approximately(extent[1], -20, 1e-9);
      assert.approximately(extent[2], 20, 1e-9);
      assert.approximately(extent[3], 0, 1e-9);
    });
  });

  describe('extend an existing feature', function () {
    let draw;
    let feature;

    beforeEach(function () {
      draw = new Draw({
        source: source,
        type: 'LineString',
      });
      map.addInteraction(draw);
      feature = new Feature(
        new LineString([
          [0, 0],
          [1, 1],
          [2, 0],
        ]),
      );
    });

    it('sets the initial state', function () {
      draw.extend(feature);
      assert.lengthOf(draw.sketchCoords_, 4);
      assert.deepEqual(draw.sketchCoords_, [
        [0, 0],
        [1, 1],
        [2, 0],
        [2, 0],
      ]);
      assert.deepEqual(draw.finishCoordinate_, [2, 0]);
    });

    it('dispatches a drawstart event', function () {
      const spy = vi.fn();
      listen(draw, 'drawstart', spy);
      draw.extend(feature);
      assert.strictEqual(spy.mock.calls.length, 1);
    });
  });

  describe('append coordinates when drawing a LineString feature with maxPoints', () => {
    let draw;
    beforeEach(() => {
      draw = new Draw({
        source: source,
        type: 'LineString',
        maxPoints: 2,
      });
      map.addInteraction(draw);
    });
    it('finishes drawing when starting empty and appending maxPoints coordinates', () =>
      new Promise((resolve, reject) => {
        draw.once('drawend', () => {
          try {
            setTimeout(() => {
              assert.lengthOf(source.getFeatures(), 1);
              resolve();
            }, 0);
          } catch (e) {
            reject(e);
            return;
          }
        });
        draw.appendCoordinates([
          [0, 0],
          [1, 1],
        ]);
      }));
  });

  describe('append coordinates when drawing a Polygon feature', function () {
    let draw;
    let coordinates;
    let coordinates2;

    beforeEach(function () {
      draw = new Draw({
        source: source,
        type: 'Polygon',
      });
      map.addInteraction(draw);
      coordinates = [
        [0, 0],
        [1, 1],
        [2, 0],
        [0, 3],
        [3, 2],
        [4, 4],
      ];
      coordinates2 = [
        [10, 10],
        [11, 11],
        [12, 10],
        [10, 13],
        [13, 12],
        [14, 14],
      ];
    });

    function isClosed(polygon) {
      const first = polygon.getFirstCoordinate();
      const last = polygon.getLastCoordinate();
      assert.deepEqual(first, last);
    }

    it('draws polygon with clicks, adds coordinates to drawing, finishing on first point', function () {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);
      isClosed(draw.sketchFeature_.getGeometry());

      // add coordinates
      draw.appendCoordinates(coordinates);

      // finish on first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      const features = source.getFeatures();
      assert.lengthOf(features, 1);
      const geometry = features[0].getGeometry();
      assert.instanceOf(geometry, Polygon);

      assert.deepEqual(geometry.getCoordinates(), [
        [
          [10, -20],
          [0, 0],
          [1, 1],
          [2, 0],
          [0, 3],
          [3, 2],
          [4, 4],
          [10, -20],
        ],
      ]);
    });

    it('adds coordinates to empty drawing', function () {
      // first point
      simulateEvent('pointermove', 0, 0);
      simulateEvent('pointerdown', 0, 0);
      simulateEvent('pointerup', 0, 0);
      draw.removeLastPoint();
      draw.appendCoordinates(coordinates);
      isClosed(draw.sketchFeature_.getGeometry());

      // finish drawing
      simulateEvent('pointerdown', 0, 0);
      simulateEvent('pointerup', 0, 0);

      const features = source.getFeatures();
      assert.lengthOf(features, 1);
      const geometry = features[0].getGeometry();
      assert.instanceOf(geometry, Polygon);

      assert.deepEqual(geometry.getCoordinates(), [
        [
          [0, 0],
          [1, 1],
          [2, 0],
          [0, 3],
          [3, 2],
          [4, 4],
          [0, 0],
        ],
      ]);
    });

    it('keeps updating the sketch feature after appending coordinates', function () {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);
      isClosed(draw.sketchFeature_.getGeometry());

      // add coordinates
      draw.appendCoordinates(coordinates);

      // add another point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);

      // sketchGeom should have a complete ring, with a double coordinate for cursor
      const sketchGeom = draw.sketchFeature_.getGeometry();
      assert.deepEqual(sketchGeom.getCoordinates(), [
        [
          [10, -20],
          [0, 0],
          [1, 1],
          [2, 0],
          [0, 3],
          [3, 2],
          [4, 4],
          [30, -20],
          [30, -20],
          [10, -20],
        ],
      ]);
    });

    it('keeps updating the sketch feature after multiple appendiges', function () {
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);
      isClosed(draw.sketchFeature_.getGeometry());

      // add coordinates
      draw.appendCoordinates(coordinates);

      // another point
      simulateEvent('pointermove', 100, 100);
      simulateEvent('pointerdown', 100, 100);
      simulateEvent('pointerup', 100, 100);

      // add another array of coordinates
      draw.appendCoordinates(coordinates2);

      // finish on first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      const features = source.getFeatures();
      assert.lengthOf(features, 1);
      const geometry = features[0].getGeometry();
      assert.instanceOf(geometry, Polygon);

      assert.deepEqual(geometry.getCoordinates(), [
        [
          [10, -20],
          [0, 0],
          [1, 1],
          [2, 0],
          [0, 3],
          [3, 2],
          [4, 4],
          [100, -100],
          [10, 10],
          [11, 11],
          [12, 10],
          [10, 13],
          [13, 12],
          [14, 14],
          [10, -20],
        ],
      ]);
    });
  });

  describe('drawing with geometryLayout', function () {
    let draw;
    function createDrawInteraction(type, geometryLayout) {
      draw = new Draw({
        source: source,
        type: type,
        geometryLayout: geometryLayout,
      });
      map.addInteraction(draw);
    }

    function drawPoint(geometryLayout) {
      createDrawInteraction('Point', geometryLayout);
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);
    }

    function drawLineString(geometryLayout) {
      createDrawInteraction('LineString', geometryLayout);
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
    }

    function drawPolygon(geometryLayout) {
      createDrawInteraction('Polygon', geometryLayout);
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
    }

    function drawCircle(geometryLayout) {
      createDrawInteraction('Circle', geometryLayout);
      // first point
      simulateEvent('pointermove', 10, 20);
      simulateEvent('pointerdown', 10, 20);
      simulateEvent('pointerup', 10, 20);

      // finish on second point
      simulateEvent('pointermove', 30, 20);
      simulateEvent('pointerdown', 30, 20);
      simulateEvent('pointerup', 30, 20);
    }

    it('respects XY layout for POINT type', function () {
      drawPoint('XY');
      const features = source.getFeatures();
      const geometry = features[0].getGeometry();
      assert.deepEqual(geometry.getCoordinates(), [10, -20]);
      assert.deepEqual(geometry.getLayout(), 'XY');
    });

    it('respects XYZ layout for POINT type', function () {
      drawPoint('XYZ');
      const features = source.getFeatures();
      const geometry = features[0].getGeometry();
      assert.deepEqual(geometry.getCoordinates(), [10, -20, 0]);
      assert.deepEqual(geometry.getLayout(), 'XYZ');
    });

    it('respects XYM layout for POINT type', function () {
      drawPoint('XYM');
      const features = source.getFeatures();
      const geometry = features[0].getGeometry();
      assert.deepEqual(geometry.getCoordinates(), [10, -20, 0]);
      assert.deepEqual(geometry.getLayout(), 'XYM');
    });

    it('respects XYZM layout for POINT type', function () {
      drawPoint('XYZM');
      const features = source.getFeatures();
      const geometry = features[0].getGeometry();
      assert.deepEqual(geometry.getCoordinates(), [10, -20, 0, 0]);
      assert.deepEqual(geometry.getLayout(), 'XYZM');
    });

    it('respects XY layout for LINESTRING type', function () {
      drawLineString('XY');
      const features = source.getFeatures();
      const geometry = features[0].getGeometry();
      assert.deepEqual(geometry.getCoordinates(), [
        [10, -20],
        [30, -20],
      ]);
      assert.deepEqual(geometry.getLayout(), 'XY');
    });

    it('respects XYZ layout for LINESTRING type', function () {
      drawLineString('XYZ');
      const features = source.getFeatures();
      const geometry = features[0].getGeometry();
      assert.deepEqual(geometry.getCoordinates(), [
        [10, -20, 0],
        [30, -20, 0],
      ]);
      assert.deepEqual(geometry.getLayout(), 'XYZ');
    });

    it('respects XYM layout for LINESTRING type', function () {
      drawLineString('XYM');
      const features = source.getFeatures();
      const geometry = features[0].getGeometry();
      assert.deepEqual(geometry.getCoordinates(), [
        [10, -20, 0],
        [30, -20, 0],
      ]);
      assert.deepEqual(geometry.getLayout(), 'XYM');
    });

    it('respects XYZM layout for LINESTRING type', function () {
      drawLineString('XYZM');
      const features = source.getFeatures();
      const geometry = features[0].getGeometry();
      assert.deepEqual(geometry.getCoordinates(), [
        [10, -20, 0, 0],
        [30, -20, 0, 0],
      ]);
      assert.deepEqual(geometry.getLayout(), 'XYZM');
    });

    it('respects XY layout for POLYGON type', function () {
      drawPolygon('XY');
      const features = source.getFeatures();
      const geometry = features[0].getGeometry();
      assert.deepEqual(geometry.getCoordinates(), [
        [
          [10, -20],
          [30, -20],
          [40, -10],
          [10, -20],
        ],
      ]);
      assert.deepEqual(geometry.getLayout(), 'XY');
    });

    it('respects XYZ layout for POLYGON type', function () {
      drawPolygon('XYZ');
      const features = source.getFeatures();
      const geometry = features[0].getGeometry();
      assert.deepEqual(geometry.getCoordinates(), [
        [
          [10, -20, 0],
          [30, -20, 0],
          [40, -10, 0],
          [10, -20, 0],
        ],
      ]);
      assert.deepEqual(geometry.getLayout(), 'XYZ');
    });

    it('respects XYM layout for POLYGON type', function () {
      drawPolygon('XYM');
      const features = source.getFeatures();
      const geometry = features[0].getGeometry();
      assert.deepEqual(geometry.getCoordinates(), [
        [
          [10, -20, 0],
          [30, -20, 0],
          [40, -10, 0],
          [10, -20, 0],
        ],
      ]);
      assert.deepEqual(geometry.getLayout(), 'XYM');
    });

    it('respects XYZM layout for POLYGON type', function () {
      drawPolygon('XYZM');
      const features = source.getFeatures();
      const geometry = features[0].getGeometry();
      assert.deepEqual(geometry.getCoordinates(), [
        [
          [10, -20, 0, 0],
          [30, -20, 0, 0],
          [40, -10, 0, 0],
          [10, -20, 0, 0],
        ],
      ]);
      assert.deepEqual(geometry.getLayout(), 'XYZM');
    });

    it('respects XY layout for CIRCLE type', function () {
      drawCircle('XY');
      const features = source.getFeatures();
      const geometry = features[0].getGeometry();
      assert.deepEqual(geometry.getCenter(), [10, -20]);
      assert.deepEqual(geometry.getRadius(), 20);
      assert.deepEqual(geometry.getLayout(), 'XY');
    });

    it('respects XYZ layout for CIRCLE type', function () {
      drawCircle('XYZ');
      const features = source.getFeatures();
      const geometry = features[0].getGeometry();
      assert.deepEqual(geometry.getCenter(), [10, -20, 0]);
      assert.deepEqual(geometry.getRadius(), 20);
      assert.deepEqual(geometry.getLayout(), 'XYZ');
    });

    it('respects XYM layout for CIRCLE type', function () {
      drawCircle('XYM');
      const features = source.getFeatures();
      const geometry = features[0].getGeometry();
      assert.deepEqual(geometry.getCenter(), [10, -20, 0]);
      assert.deepEqual(geometry.getRadius(), 20);
      assert.deepEqual(geometry.getLayout(), 'XYM');
    });

    it('respects XYZM layout for CIRCLE type', function () {
      drawCircle('XYZM');
      const features = source.getFeatures();
      const geometry = features[0].getGeometry();
      assert.deepEqual(geometry.getCenter(), [10, -20, 0, 0]);
      assert.deepEqual(geometry.getRadius(), 20);
      assert.deepEqual(geometry.getLayout(), 'XYZM');
    });
  });
});
