import {assert} from 'chai';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import {WEBGPU} from '../../../../../src/ol/has.js';
import WebGPUVectorLayer from '../../../../../src/ol/layer/WebGPUVector.js';
import {fromLonLat} from '../../../../../src/ol/proj.js';
import WebGPUVectorLayerRenderer from '../../../../../src/ol/renderer/webgpu/VectorLayer.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import Style from '../../../../../src/ol/style/Style.js';

/**
 * @param {Map} map Map.
 * @return {Promise<void>} Resolves on the next `rendercomplete`.
 */
function renderComplete(map) {
  return new Promise((resolve) => map.once('rendercomplete', () => resolve()));
}

where('WebGPU').describe('ol/layer/WebGPUVector', function () {
  /** @type {WebGPUVectorLayer} */
  let layer;
  /** @type {Map} */
  let map, target;

  beforeEach(function () {
    layer = new WebGPUVectorLayer({
      className: 'testlayer',
      source: new VectorSource(),
      style: {
        'fill-color': 'red',
        'stroke-color': 'blue',
        'stroke-width': 2,
        'text-value': 'hi',
      },
      declutter: true,
    });
    target = document.createElement('div');
    target.style.width = '100px';
    target.style.height = '100px';
    document.body.appendChild(target);
    map = new Map({
      target: target,
      layers: [layer],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });
  });

  afterEach(function () {
    if (map) {
      disposeMap(map);
    }
  });

  it('creates a renderer and exposes the declutter group', () => {
    const renderer = layer.getRenderer();
    assert.instanceOf(renderer, WebGPUVectorLayerRenderer);
    assert.strictEqual(layer.getDeclutter(), 'true');
  });

  it('loads features from the vector source', async () => {
    const source = layer.getSource();
    const spy = vi.spyOn(source, 'loadFeatures');
    layer.changed();
    await renderComplete(map);
    assert.isAtLeast(spy.mock.calls.length, 1);
  });

  it('hits a fill whose geometry stays in a different CRS than the view', async () => {
    const feature = new Feature(
      new Polygon([
        [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2],
          [0, 0],
        ],
      ]),
    );
    const source = new VectorSource({features: [feature]});
    source.setProjection('EPSG:4326');
    layer.setStyle({
      'fill-color': 'red',
    });
    layer.setSource(source);
    map.setView(
      new View({
        projection: 'EPSG:3857',
        center: fromLonLat([1, 1]),
        zoom: 5,
      }),
    );
    await renderComplete(map);
    const pixel = map.getPixelFromCoordinate(fromLonLat([1, 1]));
    const hit = map.forEachFeatureAtPixel(pixel, (f) => f);
    assert.strictEqual(hit, feature);
  });

  it('hits a displaced fill at its rendered position', async () => {
    const feature = new Feature(
      new Polygon([
        [
          [-10, -10],
          [10, -10],
          [10, 10],
          [-10, 10],
          [-10, -10],
        ],
      ]),
    );
    layer.setSource(new VectorSource({features: [feature]}));
    layer.setStyle({
      'fill-color': 'red',
      'fill-displacement': [30, 0],
      'fill-displacement-anchor': 'viewport',
    });
    map.setView(
      new View({
        center: [0, 0],
        resolution: 1,
      }),
    );
    await renderComplete(map);

    assert.isUndefined(map.forEachFeatureAtPixel([50, 50], (f) => f));
    assert.strictEqual(
      map.forEachFeatureAtPixel([80, 50], (f) => f),
      feature,
    );
  });

  it('styles with a style function and rebuilds on changed()', async () => {
    const feature = new Feature(
      new Polygon([
        [
          [-1e6, -1e6],
          [1e6, -1e6],
          [1e6, 1e6],
          [-1e6, 1e6],
          [-1e6, -1e6],
        ],
      ]),
    );
    const styleFunction = vi.fn(
      () => new Style({fill: new Fill({color: 'red'})}),
    );
    layer.setSource(new VectorSource({features: [feature]}));
    layer.setStyle(styleFunction);
    await renderComplete(map);
    const calls = styleFunction.mock.calls.length;
    assert.isAtLeast(calls, 1);
    assert.strictEqual(styleFunction.mock.calls[0][0], feature);
    layer.changed();
    await renderComplete(map);
    assert.isAbove(styleFunction.mock.calls.length, calls);
  });

  it('destroys the label corner buffer when replaced and on disposal', async () => {
    await renderComplete(map);
    const renderer = layer.getRenderer();
    const first = renderer.cornerBuffer_;
    const destroyFirst = vi.spyOn(first, 'destroy');
    renderer.afterHelperCreated();
    assert.strictEqual(destroyFirst.mock.calls.length, 1);

    const second = renderer.cornerBuffer_;
    assert.notStrictEqual(second, first);
    const destroySecond = vi.spyOn(second, 'destroy');
    map.removeLayer(layer);
    layer.dispose();
    assert.strictEqual(destroySecond.mock.calls.length, 1);
  });
});

describe('ol/layer/WebGPUVector', function () {
  /** @type {WebGPUVectorLayer} */
  let layer;
  /** @type {Map} */
  let map, target;

  beforeEach(function () {
    if (!WEBGPU) {
      this.skip();
    }
    layer = new WebGPUVectorLayer({
      className: 'testlayer',
      source: new VectorSource(),
      style: {
        'fill-color': 'red',
        'stroke-color': 'blue',
        'stroke-width': 2,
        'text-value': 'hi',
      },
      declutter: true,
    });
    target = document.createElement('div');
    target.style.width = '100px';
    target.style.height = '100px';
    document.body.appendChild(target);
    map = new Map({
      target: target,
      layers: [layer],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });
  });

  afterEach(function () {
    if (map) {
      disposeMap(map);
    }
  });

  it('creates a renderer and exposes the declutter group', () => {
    const renderer = layer.getRenderer();
    assert.instanceOf(renderer, WebGPUVectorLayerRenderer);
    assert.strictEqual(layer.getDeclutter(), 'true');
  });
});
