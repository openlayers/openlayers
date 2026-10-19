import {assert} from 'chai';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import {WEBGPU} from '../../../../../src/ol/has.js';
import WebGPUVectorLayer from '../../../../../src/ol/layer/WebGPUVector.js';
import {fromLonLat} from '../../../../../src/ol/proj.js';
import WebGPUVectorLayerRenderer from '../../../../../src/ol/renderer/webgpu/VectorLayer.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import Icon from '../../../../../src/ol/style/Icon.js';
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

  it('keeps drawing while features change, and shows features added during a build', async () => {
    const left = new Feature(
      new Polygon([
        [
          [-40, -10],
          [-20, -10],
          [-20, 10],
          [-40, 10],
          [-40, -10],
        ],
      ]),
    );
    const source = new VectorSource({features: [left]});
    layer.setSource(source);
    layer.setStyle({'fill-color': 'red'});
    map.setView(new View({center: [0, 0], resolution: 1}));
    await renderComplete(map);
    const renderer = layer.getRenderer();
    const buffers = renderer.buffers_;
    assert.isOk(buffers);

    const middle = new Feature(
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
    source.addFeature(middle);
    assert.strictEqual(renderer.buffers_, buffers);
    map.renderSync();
    assert.isTrue(renderer.buildPending_);

    const right = new Feature(
      new Polygon([
        [
          [20, -10],
          [40, -10],
          [40, 10],
          [20, 10],
          [20, -10],
        ],
      ]),
    );
    source.addFeature(right);
    await renderComplete(map);
    assert.strictEqual(
      map.forEachFeatureAtPixel([20, 50], (f) => f),
      left,
    );
    assert.strictEqual(
      map.forEachFeatureAtPixel([50, 50], (f) => f),
      middle,
    );
    assert.strictEqual(
      map.forEachFeatureAtPixel([80, 50], (f) => f),
      right,
    );
  });

  it('evaluates styles at the resolution the view settles at', async () => {
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
    const styleFunction = vi.fn(
      () => new Style({fill: new Fill({color: 'red'})}),
    );
    layer.setSource(new VectorSource({features: [feature]}));
    layer.setStyle(styleFunction);
    map.setView(new View({center: [0, 0], resolution: 1}));
    await renderComplete(map);
    assert.strictEqual(styleFunction.mock.lastCall[1], 1);

    map.getView().setResolution(1.2);
    await renderComplete(map);
    assert.strictEqual(styleFunction.mock.lastCall[1], 1.2);
  });

  it('rebuilds icons in the frame that starts a full image atlas over', async () => {
    const icon = document.createElement('canvas');
    icon.width = 8;
    icon.height = 8;
    icon.getContext('2d').fillRect(0, 0, 8, 8);
    layer.setSource(
      new VectorSource({features: [new Feature(new Point([0, 0]))]}),
    );
    layer.setStyle(new Style({image: new Icon({img: icon})}));
    map.setView(new View({center: [0, 0], resolution: 1}));
    await renderComplete(map);
    const renderer = layer.getRenderer();
    const buffers = renderer.buffers_;
    assert.lengthOf(buffers.imageEntries, 1);

    const imageAtlas = renderer.imageAtlas_;
    const filler = document.createElement('canvas');
    filler.width = 1100;
    filler.height = 1000;
    filler.getContext('2d');
    for (let i = 0; !imageAtlas.isFull(); ++i) {
      imageAtlas.add(
        /** @type {*} */ ({
          image: filler,
          sourceX: i,
          sourceY: 0,
          sourceWidth: 1000,
          sourceHeight: 1000,
        }),
      );
    }
    const generation = imageAtlas.getGeneration();
    map.renderSync();
    assert.isAbove(imageAtlas.getGeneration(), generation);
    assert.notStrictEqual(renderer.buffers_, buffers);
    assert.lengthOf(renderer.buffers_.imageEntries, 1);
    assert.isFalse(renderer.hasPendingWork());
  });

  it('follows the new source after setSource()', async () => {
    const oldSource = layer.getSource();
    layer.setStyle({'fill-color': 'red'});
    map.setView(new View({center: [0, 0], resolution: 1}));
    await renderComplete(map);
    const renderer = layer.getRenderer();
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
    const newSource = new VectorSource();
    layer.setSource(newSource);
    await renderComplete(map);
    assert.strictEqual(layer.getRenderer(), renderer);
    const buffers = renderer.buffers_;
    assert.isOk(buffers);

    oldSource.addFeature(feature.clone());
    assert.strictEqual(renderer.buffers_, buffers);

    newSource.addFeature(feature);
    await renderComplete(map);
    assert.strictEqual(
      map.forEachFeatureAtPixel([50, 50], (f) => f),
      feature,
    );
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
