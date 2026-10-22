import {assert} from 'chai';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../../src/ol/MapBrowserEvent.js';
import View from '../../../../../src/ol/View.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import FeatureEvent from '../../../../../src/ol/layer/FeatureEvent.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';

describe('ol/layer feature events', function () {
  const width = 360;
  const height = 180;

  /** @type {HTMLElement} */
  let target;
  /** @type {Map} */
  let map;
  /** @type {VectorLayer} */
  let layer;
  /** @type {Feature} */
  let below;
  /** @type {Feature} */
  let above;

  beforeEach(function () {
    target = document.createElement('div');
    target.style.position = 'absolute';
    target.style.left = '-1000px';
    target.style.top = '-1000px';
    target.style.width = width + 'px';
    target.style.height = height + 'px';
    document.body.appendChild(target);

    below = new Feature({geometry: rectangle(0, 0, 40, 40), name: 'below'});
    above = new Feature({geometry: rectangle(20, 20, 60, 60), name: 'above'});
    layer = new VectorLayer({
      source: new VectorSource({features: [below, above]}),
    });
    map = new Map({
      target,
      layers: [layer],
      view: new View({
        projection: 'EPSG:4326',
        center: [0, 0],
        resolution: 1,
      }),
    });
    map.renderSync();
  });

  afterEach(function () {
    disposeMap(map);
  });

  /**
   * @param {number} minX Left.
   * @param {number} minY Bottom.
   * @param {number} maxX Right.
   * @param {number} maxY Top.
   * @return {Polygon} Rectangle.
   */
  function rectangle(minX, minY, maxX, maxY) {
    return new Polygon([
      [
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
        [minX, minY],
      ],
    ]);
  }

  /**
   * Dispatches a map browser event at an offset from the map center, with
   * y pointing up.
   * @param {string} type Event type.
   * @param {number} x Horizontal offset from the center.
   * @param {number} y Vertical offset from the center.
   * @param {boolean} [dragging] Whether this is a drag.
   * @return {MapBrowserEvent} The event.
   */
  function simulateEvent(type, x, y, dragging) {
    const viewport = map.getViewport();
    const position = viewport.getBoundingClientRect();
    const event = {
      type,
      target: viewport.firstChild,
      clientX: position.left + x + width / 2,
      clientY: position.top - y + height / 2,
      stopPropagation: () => {},
    };
    const mapBrowserEvent = new MapBrowserEvent(type, map, event, dragging);
    map.handleMapBrowserEvent(mapBrowserEvent);
    return mapBrowserEvent;
  }

  /**
   * @param {string} type Event type to listen to on the layer.
   * @return {Array<FeatureEvent>} Events, filled in as they are dispatched.
   */
  function record(type) {
    /** @type {Array<FeatureEvent>} */
    const events = [];
    layer.on(/** @type {any} */ (type), (event) => events.push(event));
    return events;
  }

  describe('featureclick', function () {
    it('reports the features under the pointer, topmost first', function () {
      const events = record('featureclick');
      const mapBrowserEvent = simulateEvent('click', 30, 30);
      assert.lengthOf(events, 1);
      const event = events[0];
      assert.instanceOf(event, FeatureEvent);
      assert.strictEqual(event.type, 'featureclick');
      assert.strictEqual(event.layer, layer);
      assert.strictEqual(event.feature, above);
      assert.deepEqual(event.features, [above, below]);
      assert.strictEqual(event.mapBrowserEvent, mapBrowserEvent);
      assert.deepEqual(event.pixel, mapBrowserEvent.pixel);
      assert.deepEqual(event.coordinate, mapBrowserEvent.coordinate);
    });

    it('fires without features when nothing is hit', function () {
      const events = record('featureclick');
      simulateEvent('click', -100, -50);
      assert.lengthOf(events, 1);
      assert.isUndefined(events[0].feature);
      assert.deepEqual(events[0].features, []);
    });

    it('does not fire for a singleclick', function () {
      const events = record('featureclick');
      simulateEvent('singleclick', 30, 30);
      assert.lengthOf(events, 0);
    });

    it('uses the layer hit tolerance', function () {
      const events = record('featureclick');
      simulateEvent('click', 65, 65);
      assert.deepEqual(events[0].features, []);
      layer.setHitTolerance(10);
      simulateEvent('click', 65, 65);
      assert.deepEqual(events[1].features, [above]);
    });
  });

  describe('featuresingleclick', function () {
    it('fires for a singleclick only', function () {
      const events = record('featuresingleclick');
      simulateEvent('click', 30, 30);
      assert.lengthOf(events, 0);
      simulateEvent('singleclick', 30, 30);
      assert.lengthOf(events, 1);
      assert.deepEqual(events[0].features, [above, below]);
    });
  });

  describe('featurehover', function () {
    it('fires when the topmost feature changes', function () {
      const events = record('featurehover');
      simulateEvent('pointermove', 5, 5);
      simulateEvent('pointermove', 6, 6);
      simulateEvent('pointermove', 30, 30);
      simulateEvent('pointermove', 50, 50);
      simulateEvent('pointermove', -100, -50);
      assert.deepEqual(
        events.map((event) => event.feature),
        [below, above, undefined],
      );
      assert.deepEqual(
        events.map((event) => event.previousFeature),
        [undefined, below, above],
      );
    });

    it('does not fire while the pointer stays over nothing', function () {
      const events = record('featurehover');
      simulateEvent('pointermove', -100, -50);
      simulateEvent('pointermove', -101, -50);
      assert.lengthOf(events, 0);
    });

    it('reports nothing when the pointer leaves the map', function () {
      const events = record('featurehover');
      simulateEvent('pointermove', 5, 5);
      map.getViewport().dispatchEvent(new PointerEvent('pointerleave'));
      assert.lengthOf(events, 2);
      assert.isUndefined(events[1].feature);
      assert.strictEqual(events[1].previousFeature, below);
      assert.isUndefined(events[1].mapBrowserEvent);
    });

    it('reports nothing when a drag starts', function () {
      const events = record('featurehover');
      simulateEvent('pointermove', 5, 5);
      simulateEvent('pointermove', 6, 6, true);
      assert.lengthOf(events, 2);
      assert.isUndefined(events[1].feature);
      simulateEvent('pointermove', 5, 5, true);
      assert.lengthOf(events, 2);
      simulateEvent('pointermove', 5, 5);
      assert.lengthOf(events, 3);
      assert.strictEqual(events[2].feature, below);
    });
  });

  describe('listening to the map', function () {
    it('only while there are listeners', function () {
      assert.isFalse(map.hasListener('pointermove'));
      assert.isFalse(map.hasListener('click'));
      assert.isFalse(map.hasListener('singleclick'));

      const onHover = () => {};
      layer.on('featurehover', onHover);
      assert.isTrue(map.hasListener('pointermove'));
      assert.isFalse(map.hasListener('click'));

      const onClick = () => {};
      layer.on('featureclick', onClick);
      assert.isTrue(map.hasListener('click'));
      assert.isFalse(map.hasListener('singleclick'));

      layer.un('featurehover', onHover);
      assert.isFalse(map.hasListener('pointermove'));
      assert.isTrue(map.hasListener('click'));

      layer.un('featureclick', onClick);
      assert.isFalse(map.hasListener('click'));
    });

    it('stops when the layer leaves the map', function () {
      const events = record('featureclick');
      map.removeLayer(layer);
      assert.isFalse(map.hasListener('click'));
      simulateEvent('click', 30, 30);
      assert.lengthOf(events, 0);
    });

    it('does not ask the renderer without listeners', function () {
      const renderer = layer.getRenderer();
      const queryFeatures = vi.spyOn(renderer, 'queryFeatures');
      simulateEvent('click', 30, 30);
      simulateEvent('pointermove', 30, 30);
      assert.lengthOf(queryFeatures.mock.calls, 0);
    });

    it('lets the renderer release what it holds with the last listener', function () {
      const renderer = layer.getRenderer();
      const release = vi.spyOn(renderer, 'releaseQueryResources');
      const first = () => {};
      const second = () => {};
      layer.on('featurehover', first);
      layer.on('featureclick', second);
      layer.un('featurehover', first);
      assert.lengthOf(release.mock.calls, 0);
      layer.un('featureclick', second);
      assert.lengthOf(release.mock.calls, 1);
    });
  });

  describe('with a renderer that answers asynchronously', function () {
    /** @type {Array<{pixel: Array<number>, includeOccluded: boolean, resolve: function(Array<Feature>): void, reject: function(Error): void}>} */
    let queries;

    beforeEach(function () {
      queries = [];
      const renderer = layer.getRenderer();
      vi.spyOn(renderer, 'queryFeatures').mockImplementation(
        (pixel, hitTolerance, includeOccluded) =>
          new Promise((resolve, reject) => {
            queries.push({pixel, includeOccluded, resolve, reject});
          }),
      );
    });

    /**
     * @return {Promise<void>} Resolves after pending promise callbacks ran.
     */
    function settle() {
      return new Promise((resolve) => setTimeout(resolve));
    }

    it('dispatches when the query resolves', async function () {
      const events = record('featureclick');
      simulateEvent('click', 30, 30);
      assert.lengthOf(events, 0);
      queries[0].resolve([above]);
      await settle();
      assert.lengthOf(events, 1);
      assert.deepEqual(events[0].features, [above]);
    });

    it('asks for occluded features only for clicks', async function () {
      record('featureclick');
      record('featurehover');
      simulateEvent('pointermove', 30, 30);
      queries[0].resolve([]);
      await settle();
      simulateEvent('click', 30, 30);
      assert.isFalse(queries[0].includeOccluded);
      assert.isTrue(queries[1].includeOccluded);
    });

    it('keeps one query in flight, and only the latest pointer move waits', async function () {
      const events = record('featurehover');
      simulateEvent('pointermove', 5, 5);
      simulateEvent('pointermove', 6, 6);
      simulateEvent('pointermove', 7, 7);
      const latest = simulateEvent('pointermove', 30, 30);
      assert.lengthOf(queries, 1);
      queries[0].resolve([below]);
      await settle();
      assert.lengthOf(queries, 2);
      assert.deepEqual(queries[1].pixel, latest.pixel);
      queries[1].resolve([above]);
      await settle();
      assert.deepEqual(
        events.map((event) => event.feature),
        [below, above],
      );
    });

    it('answers every click, in order', async function () {
      const events = record('featureclick');
      simulateEvent('click', 5, 5);
      simulateEvent('click', 30, 30);
      simulateEvent('click', -100, -50);
      assert.lengthOf(queries, 1);
      queries[0].resolve([below]);
      await settle();
      queries[1].resolve([above]);
      await settle();
      queries[2].resolve([]);
      await settle();
      assert.deepEqual(
        events.map((event) => event.feature),
        [below, above, undefined],
      );
    });

    it('drops a hover result that a drag or leaving has outdated', async function () {
      const events = record('featurehover');
      simulateEvent('pointermove', 5, 5);
      simulateEvent('pointermove', 6, 6, true);
      queries[0].resolve([below]);
      await settle();
      assert.lengthOf(events, 0);
    });

    it('goes on after a query fails', async function () {
      const events = record('featureclick');
      simulateEvent('click', 5, 5);
      simulateEvent('click', 30, 30);
      queries[0].reject(new Error('device lost'));
      await settle();
      queries[1].resolve([above]);
      await settle();
      assert.lengthOf(events, 1);
      assert.strictEqual(events[0].feature, above);
    });
  });
});
