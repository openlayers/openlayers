import {assert} from 'chai';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import Point from '../../../../../src/ol/geom/Point.js';
import {WEBGPU} from '../../../../../src/ol/has.js';
import WebGPUVectorTileLayer from '../../../../../src/ol/layer/WebGPUVectorTile.js';
import WebGPUVectorTileLayerRenderer from '../../../../../src/ol/renderer/webgpu/VectorTileLayer.js';
import VectorTileSource from '../../../../../src/ol/source/VectorTile.js';
import {createXYZ} from '../../../../../src/ol/tilegrid.js';

describe('ol/layer/WebGPUVectorTile', () => {
  it('creates a renderer and exposes the declutter group', function () {
    if (!WEBGPU) {
      this.skip();
    }
    const layer = new WebGPUVectorTileLayer({
      source: new VectorTileSource({
        url: 'data/{z}/{x}/{y}.pbf',
      }),
      style: {
        'fill-color': '#eee',
        'text-value': 'x',
      },
      declutter: 'tiles',
    });
    const renderer = layer.createRenderer();
    assert.instanceOf(renderer, WebGPUVectorTileLayerRenderer);
    assert.strictEqual(layer.getDeclutter(), 'tiles');
    layer.dispose();
  });
});

where('WebGPU').describe('ol/layer/WebGPUVectorTile with a map', () => {
  /** @type {WebGPUVectorTileLayer} */
  let layer;
  /** @type {Map} */
  let map;

  beforeEach(() => {
    const tileGrid = createXYZ({tileSize: 64});
    layer = new WebGPUVectorTileLayer({
      source: new VectorTileSource({
        tileSize: 64,
        tileUrlFunction: (tileCoord) => tileCoord.join('/'),
        tileLoadFunction(tile) {
          const center = tileGrid.getTileCoordCenter(tile.getTileCoord());
          tile.setFeatures([new Feature(new Point(center))]);
        },
      }),
      style: {
        'circle-radius': 2,
        'circle-fill-color': '#000',
      },
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
  });

  afterEach(() => {
    disposeMap(map);
  });

  it('destroys the label corner buffer when replaced and on disposal', async () => {
    await new Promise((resolve) => map.once('rendercomplete', resolve));
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
