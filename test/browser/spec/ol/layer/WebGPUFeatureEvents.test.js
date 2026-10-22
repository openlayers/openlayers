import {assert} from 'chai';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import MapBrowserEvent from '../../../../../src/ol/MapBrowserEvent.js';
import View from '../../../../../src/ol/View.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon, {fromExtent} from '../../../../../src/ol/geom/Polygon.js';
import WebGPUVectorLayer from '../../../../../src/ol/layer/WebGPUVector.js';
import WebGPUVectorTileLayer from '../../../../../src/ol/layer/WebGPUVectorTile.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import VectorTileSource from '../../../../../src/ol/source/VectorTile.js';
import {createXYZ} from '../../../../../src/ol/tilegrid.js';

/**
 * @param {Map} map Map.
 * @return {Promise<void>} Resolves on the next `rendercomplete`.
 */
function renderComplete(map) {
  return new Promise((resolve) => map.once('rendercomplete', () => resolve()));
}

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

where('WebGPU').describe('WebGPU layer feature queries', function () {
  /** @type {Map} */
  let map;
  /** @type {WebGPUVectorLayer} */
  let layer;
  /** @type {Feature} */
  let below;
  /** @type {Feature} */
  let above;
  /** @type {Feature} */
  let alone;

  beforeEach(async function () {
    below = new Feature({geometry: rectangle(-30, -30, 10, 10), name: 'below'});
    above = new Feature({geometry: rectangle(-10, -10, 30, 30), name: 'above'});
    alone = new Feature({geometry: rectangle(-45, 35, -35, 45), name: 'alone'});
    layer = new WebGPUVectorLayer({
      source: new VectorSource({features: [below, above, alone]}),
      style: {'fill-color': 'red'},
    });
    const target = document.createElement('div');
    target.style.width = '100px';
    target.style.height = '100px';
    document.body.appendChild(target);
    map = new Map({
      target,
      layers: [layer],
      view: new View({center: [0, 0], resolution: 1}),
    });
    await renderComplete(map);
  });

  afterEach(function () {
    disposeMap(map);
  });

  describe('feature events', function () {
    /**
     * @param {string} type Event type.
     * @param {number} x Pixel x.
     * @param {number} y Pixel y.
     */
    function simulateEvent(type, x, y) {
      const viewport = map.getViewport();
      const position = viewport.getBoundingClientRect();
      const event = {
        type,
        target: viewport.firstChild,
        clientX: position.left + x,
        clientY: position.top + y,
        preventDefault: () => {},
      };
      map.handleMapBrowserEvent(new MapBrowserEvent(type, map, event));
    }

    it('dispatches featureclick with the features the GPU found', async function () {
      const events = [];
      layer.on('featureclick', (event) => events.push(event));
      simulateEvent('click', 50, 50);
      await new Promise((resolve) => layer.once('featureclick', resolve));
      assert.lengthOf(events, 1);
      assert.deepEqual(events[0].features, [above, below]);
      assert.deepEqual(events[0].pixel, [50, 50]);
    });

    it('dispatches featurehover when the topmost feature changes', async function () {
      const events = [];
      layer.on('featurehover', (event) => events.push(event));
      simulateEvent('pointermove', 50, 50);
      await new Promise((resolve) => layer.once('featurehover', resolve));
      assert.strictEqual(events[0].feature, above);
      simulateEvent('pointermove', 95, 5);
      await new Promise((resolve) => layer.once('featurehover', resolve));
      assert.isUndefined(events[1].feature);
      assert.strictEqual(events[1].previousFeature, above);
    });

    it('does no GPU work without listeners', async function () {
      const helper = layer.getRenderer().helper;
      const beginHitPass = vi.spyOn(helper, 'beginHitPass');
      simulateEvent('click', 50, 50);
      simulateEvent('pointermove', 50, 50);
      await new Promise((resolve) => setTimeout(resolve, 50));
      assert.lengthOf(beginHitPass.mock.calls, 0);
    });

    it('does not draw hit passes to the canvas, nor leave work for the next frame', async function () {
      const renderer = layer.getRenderer();
      const helper = renderer.helper;
      const prepareDraw = vi.spyOn(helper, 'prepareDraw');
      await renderer.queryFeatures([50, 50], 0, true);
      assert.lengthOf(prepareDraw.mock.calls, 0);
    });

    it('rejects a query when the device has been lost', async function () {
      const renderer = layer.getRenderer();
      vi.spyOn(renderer.helper, 'needsToBeRecreated').mockReturnValue(true);
      let rejected = false;
      try {
        await renderer.queryFeatures([50, 50], 0, true);
      } catch {
        rejected = true;
      }
      assert.isTrue(rejected);
    });
  });

  describe('queryFeatures()', function () {
    it('lists the topmost feature first, then those it covers', async function () {
      const renderer = layer.getRenderer();
      const features = await renderer.queryFeatures([50, 50], 0, true);
      assert.deepEqual(features, [above, below]);
    });

    it('leaves out covered features when not asked for them', async function () {
      const renderer = layer.getRenderer();
      const features = await renderer.queryFeatures([50, 50], 0, false);
      assert.deepEqual(features, [above]);
    });

    it('is empty where nothing is drawn', async function () {
      const renderer = layer.getRenderer();
      assert.deepEqual(await renderer.queryFeatures([95, 5], 0, true), []);
    });

    it('reaches features within the hit tolerance, nearest first', async function () {
      const renderer = layer.getRenderer();
      assert.deepEqual(await renderer.queryFeatures([20, 10], 0, true), []);
      const features = await renderer.queryFeatures([20, 10], 25, true);
      assert.deepEqual(features, [alone, above]);
    });

    it('is empty outside the map', async function () {
      const renderer = layer.getRenderer();
      assert.deepEqual(await renderer.queryFeatures([-20, 50], 0, true), []);
    });

    it('does not change what the next frame draws', async function () {
      const renderer = layer.getRenderer();
      const canvas = map.getViewport().querySelector('canvas');
      const before = canvas.toDataURL();
      await renderer.queryFeatures([50, 50], 0, true);
      layer.changed();
      await renderComplete(map);
      assert.strictEqual(canvas.toDataURL(), before);
    });

    it('does not hit text', async function () {
      layer.setSource(
        new VectorSource({features: [new Feature(new Point([0, 0]))]}),
      );
      layer.setStyle({
        'text-value': 'hello world',
        'text-font': '30px sans-serif',
      });
      await renderComplete(map);
      const renderer = layer.getRenderer();
      assert.deepEqual(await renderer.queryFeatures([50, 50], 0, true), []);
    });
  });
});

where('WebGPU').describe(
  'WebGPU vector tile layer feature queries',
  function () {
    /** @type {Map} */
    let map;
    /** @type {WebGPUVectorTileLayer} */
    let layer;

    beforeEach(async function () {
      const tileGrid = createXYZ({tileSize: 64});
      layer = new WebGPUVectorTileLayer({
        source: new VectorTileSource({
          tileSize: 64,
          tileUrlFunction: (tileCoord) => tileCoord.join('/'),
          tileLoadFunction(tile) {
            const tileCoord = tile.getTileCoord();
            const extent = tileGrid.getTileCoordExtent(tileCoord);
            tile.setFeatures([
              new Feature({
                geometry: fromExtent(extent),
                tile: tileCoord.join('/'),
              }),
            ]);
          },
        }),
        style: {'fill-color': 'red'},
      });
      const target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      map = new Map({
        target,
        layers: [layer],
        view: new View({center: [0, 0], resolution: 1}),
      });
      await renderComplete(map);
    });

    afterEach(function () {
      disposeMap(map);
    });

    it('tells apart features of different tiles that share a reference', async function () {
      const renderer = layer.getRenderer();
      const first = await renderer.queryFeatures([10, 10], 0, true);
      const second = await renderer.queryFeatures([90, 90], 0, true);
      assert.lengthOf(first, 1);
      assert.lengthOf(second, 1);
      assert.notStrictEqual(first[0].get('tile'), second[0].get('tile'));
      const tileGrid = layer.getSource().getTileGrid();
      const coordinate = map.getCoordinateFromPixel([10, 10]);
      const tileCoord = tileGrid.getTileCoordForCoordAndResolution(
        coordinate,
        tileGrid.getResolution(Number(first[0].get('tile').split('/')[0])),
      );
      assert.strictEqual(first[0].get('tile'), tileCoord.join('/'));
    });

    it('finds features in a repeated world', async function () {
      map.getView().setCenter([2 * 20037508.342789244, 0]);
      await renderComplete(map);
      const renderer = layer.getRenderer();
      const features = await renderer.queryFeatures([50, 50], 0, true);
      assert.lengthOf(features, 1);
    });

    it('is empty outside the map', async function () {
      const renderer = layer.getRenderer();
      assert.deepEqual(await renderer.queryFeatures([150, 50], 0, true), []);
    });
  },
);
